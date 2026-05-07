### BUGS To Fix
- Deletion of a workshop is not working:
    ```
    Workshop deletion error: Error [PrismaClientKnownRequestError]: 
Invalid `prisma.workshop.delete()` invocation:


Foreign key constraint violated on the constraint: `carts_guestId_fkey`
    at zr.handleRequestError (src\generated\client\runtime\client.js:69:8286)
    at zr.handleAndLogRequestError (src\generated\client\runtime\client.js:69:7581)
    at zr.request (src\generated\client\runtime\client.js:69:7288)
    at async a (src\generated\client\runtime\client.js:79:6862)
    at async DELETE (src\app\api\admin\workshops\[id]\route.ts:101:5)
  67 | ...
  68 | ...
> 69 | ...age(l),t.code){let u=s?{modelName:s,...t.meta}:t.meta;throw new b.PrismaClientKnownRequestError(l,{code:t.code,clientVers...
     |                                                                ^
  70 | ...
  71 | ...
  72 | ... {
  code: 'P2003',
  meta: {
    modelName: 'Workshop',
    driverAdapterError: Error [DriverAdapterError]: ForeignKeyConstraintViolation
        at async e.interpretNode (src\generated\client\runtime\client.js:15:44621)
        at async e.interpretNode (src\generated\client\runtime\client.js:15:45065)
        at async e.interpretNode (src\generated\client\runtime\client.js:15:43744)
        at async e.interpretNode (src\generated\client\runtime\client.js:15:46285)
        at async e.run (src\generated\client\runtime\client.js:15:43335)
        at async e.execute (src\generated\client\runtime\client.js:61:815)
        at async jt.request (src\generated\client\runtime\client.js:62:2401)
        at async Object.singleLoader (src\generated\client\runtime\client.js:69:6569)
        at async zr.request (src\generated\client\runtime\client.js:69:7175)
        at async a (src\generated\client\runtime\client.js:79:6862)
        at async DELETE (src\app\api\admin\workshops\[id]\route.ts:101:5)
      13 | ...
      14 | ...
    > 15 | ...s,this.#a()),i;for(let o of n){let s=Ia(o,r.sqlCommenter),a=await this.#u(s,r.queryable,()=>r.queryable.queryRaw(ri(s)).c...
         |                                                                ^
      16 | ...
      17 | ...
      18 | ... {
      [cause]: [Object]
    }
  },
  clientVersion: '7.8.0'
}
 DELETE /api/admin/workshops/2422341d-31d4-42d6-b776-975f7d1e9401 500 in 310ms (next.js: 7ms, application-code: 303ms)
    ```