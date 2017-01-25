## Memory consumption checker

1. Open this test.
2. Open console.
3. Go to timeline and click "collect garbage".
4. Go to profiler and make a heap snapshot.
5. Call `loadData()` or `loadData100Times()`.
6. Go to timeline and click "collect garbage".
7. Go to profiler and make a heap snapshot.

## Notes

A single `loadData()` call may not give reliable information. On first call browser's JS engine may start accumulating closures, some optimization caches, etc. Loading data 100 times would reduce the impact of these factors and give more realistic results.

This tests disables rendering in a very brute way – it cancels couple of events. Running engine with only the document model might give even better results.
