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
