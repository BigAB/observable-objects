import { assert } from "chai";
import ObservableObject, {
  observable,
  isObservable
} from "../src/observable-objects";
import Observable from "../src/observable-polyfill";
import Rx from "rxjs/Rx";
import "rxjs/add/operator/map";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/take";
import sinon from "sinon";

describe("observable-objects", () => {
  describe("class decorator", () => {
    it("should decorate any class to make instances observable", () => {
      @observable
      class MyClass {
        method() {
          return this;
        }
      }
      const instance = new MyClass();
      assert.ok(isObservable(instance), "instance is an observable-object");
    });
  });

  describe("observable instances", () => {
    let o;

    beforeEach(() => {
      @observable
      class SomeObservable {}
      o = new SomeObservable();
    });

    it("should call the subscribers next method when properties change", () => {
      // setup
      const observer = {
        next: sinon.spy()
      };
      Observable.from(o).subscribe(observer);

      // execute
      o.property = "new";

      // assert
      assert.ok(observer.next.calledOnce);
    });

    it("should NOT call the subscribers next method when properties change to the same value", () => {
      // setup
      const observer = {
        next: sinon.spy()
      };
      Observable.from(o).subscribe(observer);

      // execute
      o.property = "value";
      o.property = "value";
      o.property = "value";

      // assert
      assert.ok(observer.next.calledOnce);
    });

    it("should work fine with multiple subscribers", () => {
      // setup
      const observerA = {
        next: sinon.spy()
      };
      const observerB = {
        next: sinon.spy()
      };
      const obs = Observable.from(o);
      obs.subscribe(observerA);
      obs.subscribe(observerB);

      // execute
      o.property = "value 1";
      o.property = "value 2";
      o.property = "value 3";

      // assert
      assert.equal(observerA.next.callCount, 3);
      assert.equal(observerB.next.callCount, 3);
      assert.deepEqual(observerA.next.args[2][0], observerB.next.args[2][0]);
    });

    it("should call the subscribers next method everytime a property changes", () => {
      // setup
      const observer = {
        next: sinon.spy()
      };
      Observable.from(o).subscribe(observer);

      // execute
      o.property = "1 val";
      o.property = "2";
      o.property = 2;
      o.someOtherProp = 3;

      // assert
      const callArgs = observer.next.args;
      assert.equal(observer.next.callCount, 4);
      assert.deepEqual(callArgs[0][0], {
        target: o,
        path: "property",
        newVal: "1 val",
        oldVal: undefined
      });
      assert.deepEqual(callArgs[1][0], {
        target: o,
        path: "property",
        newVal: "2",
        oldVal: "1 val"
      });
      assert.deepEqual(callArgs[2][0], {
        target: o,
        path: "property",
        newVal: 2,
        oldVal: "2"
      });
      assert.deepEqual(callArgs[3][0], {
        target: o,
        path: "someOtherProp",
        newVal: 3,
        oldVal: undefined
      });
    });

    it(`should call the subscribers next method when "child" properties change`, () => {
      // setup
      o.child = { foo: "bar" };

      const observer = {
        next: sinon.spy()
      };

      Observable.from(o).subscribe(observer);

      // execute
      o.child.foo = "new value";

      // assert
      assert.ok(observer.next.calledOnce);
      assert.deepEqual(callArgs[0][0], {
        target: o,
        path: "property.child.foo",
        newVal: "new value",
        oldVal: "bar"
      });
    });
  });

  describe("other observable/event stream libraries", () => {
    let o;

    beforeEach(() => {
      @observable
      class SomeObservable {}
      o = new SomeObservable();
    });

    it("should work with RxJS", () => {
      // setup
      const observer = {
        next: sinon.spy()
      };
      Rx.Observable.from(o)
        .filter(({ path }) => path === "property")
        .map(({ newVal }) => newVal)
        .take(2)
        .subscribe(observer);

      // execute
      o.property = "1 val";
      o.someOtherProp = 3;
      o.property = 2;
      o.property = "too many changes";

      // assert
      const callArgs = observer.next.args;
      assert.equal(observer.next.callCount, 2);
      assert.equal(callArgs[0][0], "1 val");
      assert.equal(callArgs[1][0], 2);
    });
  });
});
