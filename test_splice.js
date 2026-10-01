const code = `#include "types.h"\n#include "pk_fsm.h"\nint main() { return 0; }`;
const includes = [...code.matchAll(/#include\s+"([^"]+)"/g)].map(m => m[1]);
console.log(includes);
