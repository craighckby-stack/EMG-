let code = `#include "types.h"\nint main() { return 0; }`;
const projectFiles = { "types.h": "typedef int i32;" };
code = code.replace(/#include\s+"([^"]+)"/g, (match, p1) => {
    const basename = p1.split('/').pop();
    if (projectFiles[basename]) {
        return `// Spliced ${p1}\n${projectFiles[basename]}`;
    }
    return match;
});
console.log(code);