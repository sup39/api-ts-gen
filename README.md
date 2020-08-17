# OpenAPI codegen for TypeScript

## What is this?
This is a TypeScript code generator which generates TypeScript types and interfaces base on your [OpenAPI document](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md), including
- `schemas`
- `IHandler`, types and interfaces for both server and client api
- `apiRouter`, server api partial implementation using [koa router](https://github.com/koajs/router)
- `ClientAPI`, client api implementation using [axios](https://github.com/axios/axios)

This tool assumes you use **koa router** for server and **axios** for client.

## How to use this tool?
### 0. Install it
```
yarn add -D @sup39/api-ts-gen
```
Also, install the dependencies that generated code will use.
```
yarn add koa @koa/router koa-body
yarn add -D @types/koa @types/koa__router axios
```

### 1. Write your OpenAPI document
You can use [Swagger Editor](https://swagger.io/tools/swagger-editor/) to edit your api document. Make sure to follow the [OpenAPI Specification](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md).

This tool generates code from `paths` and `components/schemas`.  
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
yarn run api-codegen <your-openapi-document> [-o <output-dir>] [-s <ctx.state-interface-path>] [-c]
```

The default output directory is `api/generated`.  
For example, if you put your api document at `api.yml`, and want the generated code put in `generated/` directory, you can execute
```
# example
yarn run api-codegen api.yml -o generated
```

#### Flags(Optional)
- `-o` `--output-dir <output-dir>`: output directory(default: api/generated)
- `-c` `--client-only`: client code only(default: client & server)

### 4. Implement server api
```
import {IServerAPI} from '#api/IServerAPI';

export default {
  operationId: async (req, state, ctx) => {
    // ...
    return [status, body];
  },
  // ...
} as IServerAPI;
```
The function name is the `operationId` defined in the api document.  
There are 3 arguments passed to the function.
#### req
The request parameters and body, defined in `parameters` and `requestBody`.  
Any parameter will be put in `req.{in}.{name}`, where `{in}` is one of `path`, `query`, `header`, `cookie`.  
`requestBody` will be put in `req.body`.
#### state
Alias to `ctx.state`

You can specify the type of `ctx.state` by setting the export default type to `IServerAPI<YourStateType>`.
```
// example
import {IServerAPI} from '#api/IHandler';

interface IState {
  user: {
    id: number;
  }
}
export default {
  // ...
  operationId: async (req, state, ctx) => {
    // state has IState type here
    state.user.id // number
    // ...
  },
} as IServerAPI<IState> // specify ctx.state type to IState
```
#### ctx
The `ctx` object from koa router. **Avoid to use it** unless required.  
```
// Don't do this
ctx.body = responseBody;
ctx.status = statusCode;
// Do this
return [statusCode, responseBody];
```
#### return value
`[status, body]`
If the responseBody is not required, you can omit it or pass anything to it.
```
// example
return [200, {...}];
return [404, 'some response string'];

// if responseBody is not required
return [statusCode]; // OK
return [statusCode, 'message string']; // OK
return [statusCode, {some: 'object'}]; // OK
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
// import {FullDate} from '@sup39/api-ts-gen/dist/utils';
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

Import `FullDate` class from `@sup39/api-ts-gen/dist/utils`.
```
import {FullDate} from '@sup39/api-ts-gen/dist/utils';

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
/* CAUTION: this method has been updated since version 2.0.6
  .advance(period: number): this
  return this advanced by $peroid days
*/
const d0 = new FullDate('2015-05-04');
d0.advance(217) // 2015-12-07
d0.advance(-1129) // 2012-03-31
d0 === d0.advance(-1129) // true

/*
  .advanced(period: number): FullDate
  return a new FullDate advanced by $peroid days
*/
const d0 = new FullDate('2015-05-04');
d0.advance(217) // 2015-12-07
d0.advance(-1129) // 2012-03-31
d0 === d0.advance(-1129) // false

/*
  .distanceFrom(d0: FullDate): number
  return the distance(unit: day) from d0
*/
d0.distanceFrom(new FullDate(2018, 3, 5)); // -1036
d0.distanceFrom(new FullDate(2007, 8, 31)); // 2803
```
:warning: `FullDate` use `month` from 1 to 12, which differs from `Date`. Also, `FullDate` use `day` and `dayOfWeek` instead of `date` and `day`.

#### Schema
It is not necessary to use `SomeSchema.from(...)` of `SomeSchema.Partial(...)` to create an instance to pass to the client api. Instead, simply use an object literal.

Import the schema type interfaces from `#api/schemas`.
```
import {SchemaA, SchemaB} from '#api/schemas';

api.postA({id: 3}, {...}) // OK, simpler
api.postA({id: 3}, SchemaA.from(...)); // Well, still OK
api.patchB({id: 3}, {...}) // OK, simpler
api.patchB({id: 3}, SchemaB.Partial(...)); // Well, still OK
```

:warning: From v2.0.0, `Schemas` are no longer class. Instead, it became a `interface` and a Object including `from`, `Partial`, and `fields` properties.

#### Handling response
The api is a async function that returns a `APIPromise`, which is a extended Promise. The promise is resolved if the status code is `2xx`, otherwise it is rejected.

Every operation has a different `APIPromise` definition according to the possible response **status code**.
If there is only one `2xx` in the status code and error handling is not required, you can simply use `await` to get the response body.
```
const a: SchemaA = await api.getA(...);
```
However, if you want to handle several kinds of response, you can use `.on(statusCode, responseBody => handler)` where `XXX` is the status code.
```
api.getA(...)
  .on(200, a => { // the compiler knows that type of `a` is `SchemaA`
    console.log('Get a successfully', a);
  })
  .on(404, msg => {
    console.log('Not found with msg', msg);
  })
  .on(403, () => {
    console.log('Forbidden with no msg');
  });
```

:warning: For any status, you can only call `.on(status, ...)` once.
```
// OK
api.getA(...)
  .on(200, a => ...)
  .on(403, () => ...)

// NG
api.getA(...)
  .on(200, a => ...)
  .on(200, () => ...) // Compile Error!
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
|`boolean`||`boolean`, `number`, `string`||
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
0, 1, -1, 3.14, Infinity, NaN // OK (Only 0 is converted to false)
'T', 'F' // NG, only 'true' and 'false' are valid
null, {} // NG

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
Base on `#/components/schemas`, it generates interface definitions and constructor functions in `schemas.ts`.
#### Interface Definition
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
interface Post {
  id: number;
  ts: string;
  authorID: number;
  content: string | null;
  images: string[];
  pinned: boolean;
}
```
#### Constructor Function
It also generates constructor function `Schema.from` with **strict type checking**.
The constructor function takes exactly one argument with literal object type.
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
interface NamedCircle {
  name: string;
  radius: number;
  color: string | null;
}
```
Here are some examples for strict type checking:
```
NamedCircle.from({
  name: 'red circle',
  radius: 39,
  color: 'red',
}); // OK

NamedCircle.from({
  name: 'circle with null color',
  radius: 0,
  color: null,
}); // OK, color is nullable

NamedCircle.from({
  name: 'circle with null color',
  radius: 0,
  color: undefined,
}); // Error! color should be a number or null

NamedCircle.from({
  name: 'circle without given color',
  radius: 0,
}); // Error! color should be given

NamedCircle.from({
  name: 'circle with invalid radius',
  radius: 'miku',
  color: 'cyan',
}); // Error! radius should be a number
```
#### Partial Function
It also generates a function called `Partial` for initializing Partial type.
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

:warning: Use **object literal** if possible. The `from` and `Partial` function are mainly for internal use, avoid to use them unless you want to safe and strict convert a any variable to a schema type.

### fields
`Schema` exposes its fields to `fields` constant.
Its type is `Array<keyof Schema>`.
```
NamedCircle.fields // ['name', 'radius', 'color']: Array<keyof NamedCircle>
```

### Nested Object
Any object type property which contains `id` property
will be treat specially.
When sending request, properties other than `id` will be removed,
for the convenience to work well with [Vapor](https://vapor.codes).

For example,
```
Group:
  type: "object"
  properties:
    id:
      type: "integer"
      format: "int32"
    name:
      type: "string"
    note:
      type: "string"
Person:
  type: "object"
  properties:
    id:
      type: "integer"
      format: "int32"
    group:
      $ref: "#/components/schemas/Group"
    fullName:
      type: "object"
      properties:
        firstName:
          type: "string"
        lastName:
          type: "string"
    age:
      type: "integer"
      format: "int32"
```
will become
```
interface Group {
  id: number;
  name: string;
  note: string;
}
interface Person {
  id: number;
  group: Group;
  name: {
    firstName: string;
    lastName: string;
  };
  value: number;
}
```

However, in http-request function in ClientAPI,
the type of the parameter will become
```
interface Group {
  id: number;
  name: string;
  note: string;
} // no change
interface Task {
  id: number;
  group: {
    id: number;
  }; // properties other than `id` is removed
  name: {
    firstName: string;
    lastName: string;
  }; // no change because there is no `id` property
  value: number;
}
```

## Limitations
### application/json only
This tool only supports `application/json` type for request and response body. Any other type like `multipart/form` or `image/*` are **not supported** and will be ignored.

## Versions
#### 2.0.6
- Change Full#advance and implement Full#advanced
- Nest [object-type properties with id property] conversion in request function
#### 2.0.5
- Implement \$ref support for responses, parameters, requestBody
#### 2.0.4
- Fix FullDate stringify in Axios params
- Use local timezone instead of UTC in FullDate
#### 2.0.3
- Implement `required` property of schema
- client-only codegen
#### 2.0.2
- Make number convertible to boolean
#### 2.0.1
- Use IState as a generic type and remove it from api-codegen.
#### 2.0.0
- Simplify generated code
  - Merge all APIPromise class
  - Remove IServerAPI and IClientAPI
- Remove res Object, return [status, body] in ServerAPI instead
- Remove schema classes, use interface instead
- `-s` flag for `ctx.state` interface path
#### 1.1.3
- Expose fields of schemas to XXX.fields(static variable)
#### 1.1.2
- Publish to npmjs and change the package name in generated code
- Specify constructor argument type of FullDate
#### 1.1.1
- Implement FullDate#distanceFrom(d0)
- Fix FullDate timezone bug, use UTC instead
#### 1.1.0
- Fix Partial constructor, enhance error msg
- Add int32 STP
#### 1.0.1
- implement FullDate getter, setter, function(advance)
#### 1.0.0
- ClientAPI, ServerAPI interface, Schema TS codegen implemented
- application/json only
- get, post, put, delete, patch only
