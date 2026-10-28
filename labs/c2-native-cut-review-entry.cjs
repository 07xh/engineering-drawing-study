'use strict';
// Browser packaging boundary ONLY. These are the SAME official V5 modules
// used by C1/C2/C3. esbuild embeds their unchanged source implementation
// into the public review bundle while excluding private workbench files
// and raw OpenCascade reference reports from the deployed asset tree.
globalThis.DA07TimelineV5=require('../workbench/teaching-timeline-v5.js');
globalThis.DA07MotionV5=require('../workbench/teaching-motion-v5.js');
require('./c2-native-cut-review-ui.js');
