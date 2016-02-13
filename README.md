# mongoose-orchestrator


**Keep [references to attributes](#references to attributes) synchronized.**


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

const User = mongoose.model('User', UserSchema);
```

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
