import Observable from "./observable-polyfill";
import EventEmitter from "eventemitter3";

const EVENT_EMITTER_SYMBOL = Symbol("EVENT_EMITTER_SYMBOL");
const PROPERTY_CHANGE = Symbol("PROPERTY_CHANGE");

function createObservableFromInstance() {
  return new Observable(observer => {
    // Create an event handler which sends data to the sink
    let handler = (newVal, oldVal, path) => {
      observer.next({
        target: this,
        path: path,
        newVal,
        oldVal
      });
    };

    if (!this[EVENT_EMITTER_SYMBOL]) {
      Object.defineProperty(this, EVENT_EMITTER_SYMBOL, {
        value: new EventEmitter()
      });
    }

    // Attach the event handler
    this[EVENT_EMITTER_SYMBOL].on(PROPERTY_CHANGE, handler, true);

    // Return a cleanup function which will cancel the event stream
    return () => {
      // Detach the event handler from the instance
      this[EVENT_EMITTER_SYMBOL].removeListener(PROPERTY_CHANGE, handler, true);
    };
  });
}

export function observable(target) {
  return new Proxy(target, {
    construct(target, argumentsList, newTarget) {
      const instance = Reflect.construct(target, argumentsList, newTarget);
      return new Proxy(target.prototype, {
        set(target, property, value, receiver) {
          const path = property;
          if (receiver[EVENT_EMITTER_SYMBOL] && value !== target[property]) {
            receiver[EVENT_EMITTER_SYMBOL].emit(
              PROPERTY_CHANGE,
              value,
              target[property],
              path
            );
          }
          return Reflect.set(target, property, value, receiver);
        },
        get(target, property, receiver) {
          if (property === Symbol.observable) {
            return createObservableFromInstance;
          }
          return Reflect.get(target, property, receiver);
        }
      });
    }
  });
}

export function isObservable(obj) {
  return typeof obj[Symbol.observable] === "function";
}

export { observable as decorator, observable as observeObject };

@observable
class ObservableObject {}

export default observable(ObservableObject);
