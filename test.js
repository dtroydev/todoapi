'use strict';

console.log(global);
function Car(brand) {
  console.log(this);
  if (this instanceof Car) {
    this.model = brand;
  } else return new Car(brand);
}

const car = Car('Toyota');
const car2 = new Car('Holden');

console.log(car.constructor);
console.log(car instanceof Car);
console.log(car.model);

console.log(car2.constructor);
console.log(car2 instanceof Car);
console.log(car2.model);
