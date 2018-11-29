# loopback-content-range
Support [react-admin](https://github.com/marmelab/react-admin) for [Loopback 3](https://loopback.io/) by adding Content-Range header.

## Installation

```bash
npm install --save loopback-content-range
```

## Usage

Modify your server/component-config.json to include this module:

```json
{
  "loopback-content-range": {
    "pattern": [
      "*.find"
    ],
    "relatedModels": true
  },
}
```

## Options

### `pattern`: Array of String

Method patterns that `Content-Range` header will be added.

Accepted patterns: See https://loopback.io/doc/en/lb3/Remote-hooks.html#wildcards.

Default value: `[ "*.find" ]`, which auto added to find method of all models.

### `relatedModels`: Boolean


## Credits

Based on [loopback3-xTotalCount](https://github.com/kimkha/loopback3-xTotalCount) and [loopback-component-react-admin](https://github.com/kimkha/loopback-component-react-admin)