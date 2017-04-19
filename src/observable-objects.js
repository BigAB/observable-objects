import Observable from './observable-polyfill';
import EventEmitter from 'eventemitter3';

const OBSERVABLE_SYMBOL = Symbol.for('observable-object');
const EVENT_EMITTER_SYMBOL = Symbol('EVENT_EMITTER_SYMBOL');
const OBSERVABLE_INSTANCE_SYMBOL = Symbol('OBSERVABLE_INSTANCE_SYMBOL');
const CHANGE_EVENT_NAME = 'change';

function listen(instance, eventName) {
  return new Observable(observer => {
    // Create an event handler which sends data to the sink
    let handler = (newVal, oldVal, path) => {
      observer.next({
        target: instance,
        path: path,
        newVal,
        oldVal,
      });
    };

    // Attach the event handler
    instance[EVENT_EMITTER_SYMBOL].on(eventName, handler, true);

    // Return a cleanup function which will cancel the event stream
    return () => {
      // Detach the event handler from the instance
      instance[EVENT_EMITTER_SYMBOL].removeListener(eventName, handler, true);
    };
  });
}

export function observable(target) {
  target.prototype[OBSERVABLE_SYMBOL] = true;

  return new Proxy(target, {
    construct(target, argumentsList, newTarget) {
      let instance = new Proxy(
        Reflect.construct(target, argumentsList, newTarget),
        {
          set(target, property, value, receiver) {
            const path = property;
            if (value !== target[property]) {
              target[EVENT_EMITTER_SYMBOL].emit(
                CHANGE_EVENT_NAME,
                value,
                target[property],
                path,
              );
            }
            return Reflect.set(target, property, value, receiver);
          },
          get(target, property, receiver) {
            return Reflect.get(target, property, receiver);
          },
        },
      );
      Object.defineProperties(instance, {
        [EVENT_EMITTER_SYMBOL]: {
          value: new EventEmitter(),
        },
        [OBSERVABLE_INSTANCE_SYMBOL]: {
          value: listen(instance, CHANGE_EVENT_NAME),
        },
      });
      Object.defineProperties(instance, {
        subscribe: {
          value: instance[OBSERVABLE_INSTANCE_SYMBOL].subscribe.bind(
            instance[OBSERVABLE_INSTANCE_SYMBOL],
          ),
        },
      });
      return instance;
    },
  });
}

export function isObservable(obj) {
  return !!obj[OBSERVABLE_SYMBOL];
}

export {observable as decorator};

@observable class ObservableObject {}

export default ObservableObject;
