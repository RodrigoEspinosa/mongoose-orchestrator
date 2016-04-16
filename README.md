![mongoose-orchestrator](https://dl.dropboxusercontent.com/u/73676286/GitHub/mongoose-orchestrator-name.jpeg)


**Keep your _references to attributes_ synchronized.**

[![npm version](https://badge.fury.io/js/mongoose-orchestrator.svg)](https://badge.fury.io/js/mongoose-orchestrator)
[![Build Status](https://travis-ci.org/RodrigoEspinosa/mongoose-orchestrator.svg?branch=master)](https://travis-ci.org/RodrigoEspinosa/mongoose-orchestrator)
[![Dependency Status](https://david-dm.org/RodrigoEspinosa/mongoose-orchestrator.svg)](https://david-dm.org/RodrigoEspinosa/mongoose-orchestrator)
[![devDependency Status](https://david-dm.org/RodrigoEspinosa/mongoose-orchestrator/dev-status.svg)](https://david-dm.org/RodrigoEspinosa/mongoose-orchestrator#info=devDependencies)

---

This project is continuously tested on **Node 0.12** and **Node 4.0**.
Compatible with **Mongoose 3.8** and above.


## Install

```bash
$ npm install mongoose-orchestrator
```

## Use

```js
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const UserSchema = mongoose.Schema({

  name: { type: String, required: true },

  country: { type: ObjectId, ref: 'Country' },
  countryName: { type: String, ref: 'Country.name', sync: true }
});

UserSchema.plugin(require('mongoose-orchestrator'));
```

Use the key `sync: true` on your schema, that's the way `mongoose-orchestrator`
will look for attributes that needs to be synchronized.

Have an attribute with a lowercased version of the model name.

The `ref` key on the attributes object means the attribute to lookup, using the
following nomenclature: `<<MODEL_NAME>>.<<ATTRIBUTE_NAME>>`. For example,
`Country.name` means the attribute `name` in the `Country` model.

Require the `mongoose-orchestrator` plugin for the schema.


**Specifying a source**

The `source` keyword is the attribute of the instance where the reference will
be stored. As default, is a lowercased version of the reference model.

You can create a schema as the following:

```js
mongoose.Schema({

  name: { type: String, required: true },

  country: {
    id: { type: ObjectId, ref: 'Country' },
    name: { type: String, ref: 'Country.name', sync: true, source: 'country.id' }
  }

});
```

_Default:_ `modelName.toLowerCase()`;

**Transformations**

Set a transformation for the referenced attribute. This function will be
applied to the value before persisting it.

```js
mongoose.Schema({

  name: { type: String, required: true },

  country: {
    id: {
      type: ObjectId,
      ref: 'Country'
    },
    name: {
      type: String,
      ref: 'Country.name',
      sync: true,
      source: 'country.id'
    },
    nameInitial: {
      type: String,
      ref: 'Country.name',
      sync: true,

      // Set the transformation function.
      transformation: function(value) {
        return (value.length) ? value[0] : '';
      }
    }
  }

});
```

_Default:_ `function (value) { return value; }`.

## Example

```js
const mongoose = require('mongoose');
const mongooseOrchestrator = require('mongoose-orchestrator');
const ObjectId = mongoose.Schema.Types.ObjectId;

// Create and register the `Season` model.

const SeasonSchema = new mongoose.Schema({

  name: {type: String, required: true}

});

mongoose.model('Season', SeasonSchema);


// Create and register the `Episode` model.

const EpisodeSchema = new mongoose.Schema({

  name: {type: String, required: true},

  season: {type: ObjectId, ref: 'Season'},
  seasonName: {type: String, ref: 'Season.name', sync: true}

});

EpisodeSchema.plugin(mongooseOrchestrator);

mongoose.model('Episode', EpisodeSchema);
```

**Under the hood...**
![mongoose-orchestrator-events-example](https://dl.dropboxusercontent.com/u/73676286/GitHub/mongoose-orchestrator-events-example.gif)



## LICENSE

The MIT License (MIT)

Copyright (c) 2016 Rodrigo Espinosa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
