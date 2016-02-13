![mongoose-orchestrator](https://dl.dropboxusercontent.com/u/73676286/GitHub/mongoose-orchestrator-name.jpeg)


**Keep your _references to attributes_ synchronized.**


---

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

Use the key `sync: true` on your schema, that's the way `mongoose-orchestrator` will look for attributes that needs to be synchronized.

Have an attribute with a lowercased version of the model name.

The `ref` key on the attributes object means the attribute to lookup, using the following nomenclature: `<<MODEL_NAME>>.<<ATTRIBUTE_NAME>>`. For example, `Country.name` means the attribute `name` in the `Country` model.

Require the `mongoose-orchestrator` plugin for the schema.



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


## Limitations

- You can only use one model per schema.
- You can't specify the attribute for the reference. It has to be a lowercased version of the source model.

At the moment, you can't do this:

```js
mongoose.Schema({

  name: { type: String, required: true },

  country: {
    id: { type: ObjectId, ref: 'Country' },
    name: { type: String, ref: 'Country.name', sync: true, source: 'country.id' }
  }

});
```

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
