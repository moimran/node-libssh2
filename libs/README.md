# Native Libraries

This directory contains platform-specific native libraries for libssh2.

## Directory Structure

```
libs/
├── windows/
│   └── libssh2.dll          # Windows x64 libssh2 library
├── linux/
│   └── x64/
│       ├── libssh2.so.1.0.1 # Linux x64 libssh2 library (actual file)
│       ├── libssh2.so.1     # Symlink to libssh2.so.1.0.1
│       └── libssh2.so       # Symlink to libssh2.so.1
└── macos/
    └── x64/
        └── libssh2.dylib    # macOS x64 libssh2 library (future)
```

## Platform Support

- ✅ **Windows x64**: Bundled libssh2.dll (included)
- ✅ **Linux x64**: Bundled libssh2.so.1.0.1 (included)
- 🔄 **macOS x64**: Ready for bundled libssh2.dylib (future)

## Library Loading Priority

The FFI loader tries libraries in this order:

1. **Bundled library** (from this directory)
2. **System library** (fallback)

This ensures the library works out-of-the-box without requiring users to install libssh2 separately.

## Building Libraries

### Linux

```bash
# Install dependencies
sudo apt-get install build-essential cmake git libssl-dev zlib1g-dev

# Clone and build libssh2
git clone https://github.com/libssh2/libssh2.git
cd libssh2
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=ON -DCRYPTO_BACKEND=OpenSSL
make -j$(nproc)

# Copy to libs directory
cp src/libssh2.so.1.0.1 /path/to/node-libssh2/libs/linux/x64/
cd /path/to/node-libssh2/libs/linux/x64/
ln -sf libssh2.so.1.0.1 libssh2.so.1
ln -sf libssh2.so.1 libssh2.so
```

### macOS

```bash
# Install dependencies
brew install cmake openssl zlib

# Clone and build libssh2
git clone https://github.com/libssh2/libssh2.git
cd libssh2
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=ON -DCRYPTO_BACKEND=OpenSSL
make -j$(sysctl -n hw.ncpu)

# Copy to libs directory
cp src/libssh2.dylib /path/to/node-libssh2/libs/macos/x64/
```

## License

The bundled libssh2 libraries are subject to the libssh2 license.
See: https://github.com/libssh2/libssh2/blob/master/COPYING
