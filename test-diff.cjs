const { applyPatch } = require('diff');

const source = `function hello() {
  console.log("hello");
}

function world() {
  console.log("world");
}`;

const patch = `--- a/file
+++ b/file
@@ -1,3 +1,3 @@
 function hello() {
-  console.log("hello");
+  console.log("hello optimized");
 }
`;

console.log(applyPatch(source, patch));
