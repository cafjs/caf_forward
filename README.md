# CAF.js (Cloud Assistant Framework)

Co-design permanent, active, stateful, reliable cloud proxies with your web app or gadget.

See http://www.cafjs.com

## CAF Forward

[![Build Status](https://travis-ci.org/cafjs/caf_forward.svg?branch=master)](https://travis-ci.org/cafjs/caf_forward)

This library provides a plugin to proxy http requests.

## API

Configuration is managed by a dedicated CA per user (e.g., `admin`), using a SharedMap with a well known name (e.g., `forwarding`) to store the routing table.

Bindings in that table are of the form `caName -> new_url_prefix`, where `caName` is the first element of the original url path (respecting `<owner>-<localname>` syntax).

For example, if we are accessing a resource `https://root-xx.cafjs.com/foo-ca1/xx.md`, we use the SharedMap `forwarding` of CA `foo-admin` in the application `root-xx`. If it contains the binding:

      foo-ca1 -> https://somewhere.com

then we rewrite the address to `https://somewhere.com/xx.md` before we forward the HTTP request.

## Configuration Example

### framework.json

See {@link module:caf_forward/plug_forward}

    {
     "name": "top",
     "components" : [
        {
            "name": "sharing"
        },
        {
            "module": "caf_forward/plug",
            "name": "forward",
            "description": "HTTP proxy plugin\n Properties: ",
             "env": {
                         "adminCA": "process.env.ADMIN_CA||admin",
                         "forwardingTable": "process.env.FORWARDING_TABLE||forwarding"
                    }
        },
        {
           "name": "pipeline",
           "components" : [
               {
                   "name" :"static2"
               },
               {
                   "name": "forward",
                   "module": "caf_forward/pipe",
                   "description": "Forward HTTP requests.",
                    "env" : {
                        "webSocketPipe": false,
                        "httpPipe" : true,
                        "path": "/"
                    }
                }
            ]
        }
      ]
    }

### ca.json

None
