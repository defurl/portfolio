## Ultra-Low-Latency Inference Engine

In electronic trading, predicting price moves is only half the battle. If model inference takes more than a few microseconds, the opportunity is lost to faster participants.

This inference engine compiles PyTorch and TensorFlow deep learning model representations into highly optimized C++ implementations. It relies on custom memory allocation strategies, memory-mapped tensor storage, and cache-friendly data structures to minimize latency spikes. By bypassing standard runtime overheads, it achieves sub-microsecond forward passes for dense neural network layers.

It runs bare-metal alongside the market gateway, executing inference directly on incoming market updates within the critical path.

**Stack:** C++20, ONNX Runtime, AVX-512 vectorization, PyTorch.
