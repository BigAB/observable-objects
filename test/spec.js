import {assert} from 'chai';
import ObservableObject, {
  observable,
  isObservable,
} from '../src/observable-objects';
import sinon from 'sinon';

describe('observable-objects', () => {
  describe('class decorator', () => {
    it('should decoarate any class as observble', () => {
      @observable class MyClass {
        method() {
          return this;
        }
      }
      const instance = new MyClass();
      assert.ok(isObservable(instance), 'instance is an observable-object');
    });
  });

  describe('observable instances', () => {
    let o;

    beforeEach(() => {
      @observable class SomeObservable {}
      o = new SomeObservable();
    });

    it('should implement the observable interface', () => {
      assert.ok(o.subscribe);
    });

    it('should call the subscribers next method when properties change', () => {
      // setup
      const observer = {
        next: sinon.spy(),
      };
      o.subscribe(observer);

      // execute
      o.property = 'new';

      // assert
      assert.ok(observer.next.calledOnce);
    });

    it('should NOT call the subscribers next method when properties change to the same value', () => {
      // setup
      const observer = {
        next: sinon.spy(),
      };
      o.subscribe(observer);

      // execute
      o.property = 'value';
      o.property = 'value';
      o.property = 'value';

      // assert
      assert.ok(observer.next.calledOnce);
    });

    it('should call the subscribers next method everytime a property changes', () => {
      // setup
      const observer = {
        next: sinon.spy(),
      };
      o.subscribe(observer);

      // execute
      o.property = '1 val';
      o.property = '2';
      o.property = 2;
      o.property = 3;

      // assert
      const callArgs = observer.next.args;
      assert.equal(observer.next.callCount, 4);
      assert.deepEqual(callArgs[0][0], {
        target: o,
        path: 'property',
        newVal: '1 val',
        oldVal: undefined,
      });
      assert.deepEqual(callArgs[1][0], {
        target: o,
        path: 'property',
        newVal: '2',
        oldVal: '1 val',
      });
      assert.deepEqual(callArgs[2][0], {
        target: o,
        path: 'property',
        newVal: 2,
        oldVal: '2',
      });
      assert.deepEqual(callArgs[3][0], {
        target: o,
        path: 'property',
        newVal: 3,
        oldVal: 2,
      });
    });
  });
});
