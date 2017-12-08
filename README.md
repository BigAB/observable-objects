# observable-objects

[![Build Status](https://travis-ci.org/BigAB/observable-objects.svg?branch=master)](https://travis-ci.org/BigAB/observable-objects)

Create objects that you can subscribe to any property changes

```
@observable
class MyObservableClass {}
const obsObj = new MyObservableClass();

Rx.Observable.from(obsObj)
  .filter(({ path }) => path === "property")
  .map(({ newVal }) => newVal)
  .take(2)
  .subscribe({
    next(v) { console.log(v) }
  });

obsObj.property = "1 val";
obsObj.someOtherProp = 3;
obsObj.property = 2;
obsObj.property = "too many changes";

/*
    Logs:
      "1 val"
      2
 */
```
