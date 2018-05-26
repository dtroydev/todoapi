'use strict';

const validator = (req, res, schema, validFields) => {
  // shorthand
  const { body: doc } = req;

  // validation - value type mismatches, prohibited/unknown fields, empty objects
  // top level check - nesting not supported
  const testInvalid = (f) => {
    // if not in approved list then invalidate
    if (!validFields.includes(f)) return true;

    // get supplied type
    // match something in => [object something]
    const objTypeRe = /\w+(?=])/;
    const docType = Object.prototype.toString.call(doc[f]).match(objTypeRe)[0];

    // get correct type
    const fieldType = schema.path(f).instance;

    // check if identical
    return docType !== fieldType;
  };

  const fields = Object.keys(doc);

  // returns true if valid
  return !(fields.some(testInvalid) || fields.length === 0);
};

exports.validator = validator;
