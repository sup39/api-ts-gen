# OpenAPI codegen for TypeScript

## What is this?
It is a TypeScript code generator which generates TypeScript classes and interfaces base on your [OpenAPI document](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md), including
- `schemas`
- `IHandler`, type-defined interfaces for both server and client api
- `IServerAPI`, interface for server api
- `IClientAPI`, interface for client api
- `apiRouter`, server api prototype using [koa router](https://github.com/koajs/router)
- `ClientAPI`, client api implementation using [axios](https://github.com/axios/axios)

This tool assumes you use **koa router** for server and **axios** for client.

## How to use it?
### 0. Install this tool
```
yarn add -D @supmiku39/api-ts-gen
```
Also, install the dependencies that generated code will use.
```
yarn add koa @koa/router koa-body
yarn add -D @types/koa @types/koa__router axios
```

### 1. Write your OpenAPI document
You can use [Swagger Editor](https://swagger.io/tools/swagger-editor/) to edit your api document. Make sure to follow the [OpenAPI Specification](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md).

This code generator generates code from `paths` and `components/schemas`.  
:warning: only `get`, `post`, `update`, `delete`, `patch` are supported in `paths`

### 2. Set path alias
Determine the **output directory for generated code** and the **server api implementation location**, and edit your `tsconfig.json`:
```
{
  // ...
  "compilerOptions": {
    // ...
    "baseUrl": ".", // or your project root
    "paths": {
      // ...
      "#api/*": ["path/to/your/output/directory/for/generated/code/*"],
      "#ServerAPI": ["path/to/your/server/api/implementation"]
    }
  }
}
```
If you use webpack, you should also edit your `webpack.config.js`:
```
module.exports = {
  // ...
  resolve: {
    // ...
    alias: {
      '#api': 'path/to/your/output/directory/for/generated/code',
      // #ServerAPI is not required
    },
  },
};
```
### 3. Run this tool
```
yarn run api-codegen <your-openapi-document> [-o <output-dir>]
```
The default output directory is `api/generated`.  
For example, if you put your api document at `api.yml`, and want the generated code put in `generated/` directory, you can execute
```
# example
yarn run api-codegen api.yml -o generated
```
### 4. Implement server api
```
import IAPI from '#api/IServerAPI';

export default {
  operationId: async (req, res, state, ctx) => {
    // ...
  },
  // ...
} as IAPI;
```
The function name is the `operationId` defined in the api document.  
There are 4 arguments passed to the function.
#### req
The request parameters and body, defined in `parameters` and `requestBody`.  
Any parameter will be put in `req.{in}.{name}`, where `{in}` is one of `path`, `query`, `header`, `cookie`.  
`requestBody` will be put in `req.body`.
#### res
The response object.
```
// call this in the server api implementation to response
res[statusCode](responseBody);
```
If the responseBody is not required, you can omit it or pass anything to it.
```
// if responseBody is not required
res[statusCode](); // OK
res[statusCode]('message string'); // OK
res[statusCode]({some: 'object'}); // OK
```
#### state
Alias to `ctx.state`
#### ctx
The `ctx` object from koa router. **Avoid to use it** unless required.  
```
// Don't do this unless required
ctx.body = responseBody;
ctx.status = statusCode;
// Do this
res[statusCode](responseBody);
```

### 5. Mount the api router to server
```
import * as Koa from 'koa';
import apiRouter from '#api/apiRouter';

const app = new Koa();
// some other entry

app.use(apiRouter.prefix('/your/api/prefix').routes());
// or simply app.use(apiRouter.routes());

app.listen(yourAppListenPort);
```

### 6. Use api in client
Simply import and use it! Like the server api, the function name will be the `operationId` defined in the api document, and the parameters will be the `parameters` and `requestBody` if defined.

```
api.{operationId}([path], [query], [header], [cookie], [body])
```
where the `path`, `query`, `header`, `cookie` is a object whose key is the `name` defined in `parameters` in the api document, and `body` is the `requestBody`.

:bulb: Note that if the method is `patch`, `req.body` will be `Partial`, which means that any property can be omitted.

```
import api from '#api/ClientAPI';
// import {FullDate} from '@supmiku39/api-ts-gen/utils';
// import {SchemaA} from '#api/schemas';

// ...
api.operationWithPath({pathName: pathValue});
api.operationWithQueryAndBody({queryName: queryValue}, body);
api.operationWithPathAndQueryAndBody({
  pathName1: pathvalue1,
  pathName2: pathvalue2,
  pathName3: pathvalue3,
}, {
  queryName1: queryvalue1,
  queryName2: queryvalue2,
}, body);
```
If you set the prefix of the api, you have to set the `$baseURL` of client api.
```
api.$baseURL = '/same/as/the/prefix/in/server';
```

#### FullDate
If the format is `string` `date`, you should use `FullDate` instead of `Date`.
`FullDate` is a wrapper of `Date`, which implements `.toString()`, `.toJSON()` and `.valueOf()` to make it more convenience to convert it to String or JSON.

Import `FullDate` class from `@supmiku39/api-ts-gen/utils`.
```
import {FullDate} from '@supmiku39/api-ts-gen/utils';

// initialization
new FullDate(new Date()); // from a Date instance
new FullDate(); // today
new FullDate('2012-03-31'); // 2012-03-31
new FullDate(2015, 5); // 2015-05-01
new FullDate(2015, 5, 4); // 2015-05-04
new FullDate(1449446400000); // 2015-12-07

// getter
const d = new FullDate();
d.date // a Date instance clone
d.year // date.getUTCFullYear()
d.month // date.getUTCMonth()+1
d.day // date.getUTCDate()
d.dayOfWeek // date.getUTCDay()

// setter
d.year = 2018; // date.setUTCFullYear(2018)
d.month = 3; // date.setUTCMonth(3-1)
d.day = 5; // date.setUTCDate(5)

// method
/*
  .advance(period: number): FullDate
  return a new FullDate that advanced by $peroid days
*/
const d0 = new FullDate('2015-05-04');
d0.advance(217) // 2015-12-07
d0.advance(-1129) // 2012-03-31

/*
  .distanceFrom(d0: FullDate): number
  return the distance(unit: day) from d0
*/
d0.distanceFrom(new FullDate(2018, 3, 5)); // -1036
d0.distanceFrom(new FullDate(2007, 8, 31)); // 2803
```
:warning: `FullDate` use `month` from 1 to 12, which differs from `Date`. Also, `FullDate` use `day` and `dayOfWeek` instead of `date` and `day`.

#### Schema
It is not necessary to use `new SomeSchema(...)` of `SomeSchema.Partial(...)` to create an instance to pass to the client api. Instead, simply use an object literal.

Import the schema classes from `#api/schemas`.
```
import {SchemaA, SchemaB} from '#api/schemas';

api.postA({id: 3}, {...}) // OK, simpler
api.postA({id: 3}, new SchemaA(...)); // Well, still OK
api.patchB({id: 3}, {...}) // OK, simpler
api.patchB({id: 3}, SchemaB.Partial(...)); // Well, still OK
```

#### Handling response
The api is a async function that returns a `APIPromise`, which is a extended Promise. The promise is resolved if the status code is `2xx`, otherwise it is rejected.

Every operation has a different `APIPromise` definition according to the possible response **status code**.
If there is only one `2xx` in the status code and error handling is not required, you can simply use `await` to get the response body.
```
const a: SchemaA = await api.getA(...);
```
However, if you want to handle several kinds of response, you can use `.onXXX(responseBody => handler)` where `XXX` is the status code.
```
api.getA(...)
  .on200(a => { // the compiler knows that type of `a` is `SchemaA`
    console.log('Get a successfully', a);
  })
  .on404(msg => {
    console.log('Not found with msg', msg);
  })
  .on403(() => {
    console.log('Forbidden with no msg');
  });
```

## Details
### Type Conversion
[OpenAPI data types](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#dataTypes) will be convert to TypeScript types as following:
| type | format | | TypeScript |
|----|----|----|----|
|`integer`||→|`number`|
|`number`||→|`number`|
|`string`||→|`string`|
|`boolean`||→|`boolean`|
|`string`|`date`|→|`FullDate`|
|`string`|`date-time`|→|`Date`|
In addition, assigning `nullable: true` makes it nullable.

### Strict Type Parser(STP)
To ensure type safety, `STP` provides some static functions to convert `any` type to specific type.
| type | format | valid type | note |
|----|----|----|----|
|`integer`|`int32`|`number`, `string`|integer between `-2147483648` and `2147483647` only|
|`integer`|`int64`|`number`, `string`|no check for range and floating point|
|`number`||`number`, `string`|`NaN` and `Infinity` is valid|
|`string`||`string`||
|`boolean`||`boolean`, `string`||
|`string`|`date`|`FullDate`, `Date`, `number`, `string`||
|`string`|`date-time`|`Date`, `number`, `string`||
|`string`|`byte`|`string`, `Buffer`|no validation check|
|`string`|`binary`|`string`, `Buffer`|no validation check|
In addition, assigning `nullable: true` makes it nullable.

```
// integer.int32
39 // OK
'39' // OK
'1e3' // NG, no scientific notation
3.14 // NG, not a integer
2147483648 // NG, overflow
'1e100' // NG, overflow
NaN // NG, not a integer
Infinity // NG, not a integer
'pi' // NG, not a number

// integer.int64, number
39 // OK
'39' // OK
'1e3' // OK
3.14 // OK, although it is convertible to int64
2147483648 // OK
'1e100' // OK, although too big for int64
NaN // OK, although it is convertible to int64
Infinity // OK, although it is convertible to int64
'pi' // NG, not a number

// boolean
true, false // OK
'true', 'false' // OK
'T', 'F' // NG, only 'true' and 'false' are valid
0, 1 // NG, same reason

// FullDate
new FullDate() // OK
new Date() // OK
'2017-05-28' // OK
1449446400000 // OK, 2015-12-07
'today' // NG, not a valid Date

// Date
new Date() // OK
'2017-05-28' // OK
1449446400000 // OK, 2015-12-07T00:00:00.000Z
new FullDate() // NG
'today' // NG, not a valid Date

// string.byte
'5aeJ5qeY44GL44KP44GE44GE' // OK
'********' // Well, OK, although invalid for a base64 string
Buffer.from('nya') // OK, a Buffer(node.js)
0x52391207 // NG, number is invalid
new Blob([]) // NG, Blob is not supported

// string.
'e5a789e6a798e3818be3828fe38184e38184' // OK
'********' // Well, OK, although invalid for a hex string
Buffer.from('nya') // OK, a Buffer(node.js)
0x52391207 // NG, number is invalid
new Blob([]) // NG, Blob is not supported
```

### Schema
Base on `#/components/schemas`, it generates class definitions and constructors in `schemas.ts`.
#### Class Definition
For example,
```
Post:
  type: "object"
  properties:
    id:
      type: "integer"
      format: "int32"
    ts:
      type: "string"
      format: "date-time"
    authorID
      type: "integer"
      format: "int32"
    content:
      type: "string"
      nullable: true
    images:
      type: "array"
      items:
        type: "string"
        format: "binary"
    pinned:
      type: "boolean"
```
will become
```
class Post {
  id: number;
  ts: string;
  authorID: number;
  content: string | null;
  images: string[];
  pinned: boolean;
}
```
#### Constructor
It also generates constructors with **strict type checking**.
The constructor takes exactly one argument with literal object type.
If any property of the argument is not convertible to expected type, it throws an `BadValueError`.

For example,
```
NamedCircle:
  type: "object"
  properties:
    name:
      type: "string"
    radius:
      type: "number"
      format: "double"
    color:
      type: "string"
      nullable: true
```
will become
```
class NamedCircle {
  name: string;
  radius: number;
  color: string | null;
}
```
Here are some examples for strict type checking:
```
new NamedCircle({
  name: 'red circle',
  radius: 39,
  color: 'red',
}); // OK

new NamedCircle({
  name: 'circle with null color',
  radius: 0,
  color: null,
}); // OK, color is nullable

new NamedCircle({
  name: 'circle with null color',
  radius: 0,
  color: undefined,
}); // Error! color should be a number or null

new NamedCircle({
  name: 'circle without given color',
  radius: 0,
}); // Error! color should be given

new NamedCircle({
  name: 'circle with invalid radius',
  radius: 'miku',
  color: 'cyan',
}); // Error! radius should be a number
```
#### Partial Function
It also generates a static function called `Partial` for initializing Partial type.
The function also takes exactly one argument.
If any property of the argument is absent or is undefined, the function will skip setting the property.
However, if the property is given but not convertible to expected type, it throws a `BadValueError`.

Here are some examples.
```
NamedCircle.Partial({
  name: 'circle with radius 39',
  radius: 39,
  color: 'cyan',
}); // OK

NamedCircle.Partial({
  name: 'circle without radius and color',
}); // OK

NamedCircle.Partial({
  radius: 1207,
}); // OK

NamedCircle.Partial({}); // OK

NamedCircle.Partial({
  radius: 1207,
  color: null,
}); // OK, color can be null

NamedCircle.Partial({
  name: undefined,
  radius: 1207,
  color: null,
}); // OK, just skip setting name

NamedCircle.Partial({
  name: null,
  radius: 'miku',
  color: 'cyan',
}); // Error! name is not nullable

NamedCircle.Partial({
  radius: 'miku',
  color: 'cyan',
}); // Error! radius should be a number
```

:warning: Use **object literal** if possible. The constructor and Partial function are mainly for internal use, avoid to use them unless you want to safe and strict convert a any variable to a schema type.

## Limitations
### application/json only
This tool only supports `application/json` type for request and response body. Any other type like `multipart/form` or `image/*` are **not supported** and will be ignored.

### schema $ref only
Other $ref like requestBody, responseBody are not supported currently.

## Versions
#### 1.1.2
- publish to npmjs and change the package name in generated code
- specify constructor argument type of FullDate
#### 1.1.1
- implement FullDate#distanceFrom(d0)
- fix FullDate timezone bug, use UTC instead
#### 1.1.0
- fix Partial constructor, enhance error msg
- add int32 STP
#### 1.0.1
- implement FullDate getter, setter, function(advance)
#### 1.0.0
- ClientAPI, ServerAPI interface, Schema TS codegen implemented
- application/json only
- get, post, put, delete, patch only
