# Lab2 将Rust程序封装为Docker镜像
## Step1 编写Dockerfile
需要在项目根目录下创建一个Dockerfile文件，内容如下：
```Dockerfile
# Image pre-built from the official Rust image
# base on the Debian Bullseye slim image
FROM rust:1.83.0-slim-bullseye AS base

# Copy the source code and the Cargo.toml file
COPY ./Cargo.toml ./Cargo.toml
COPY ./src ./src
RUN cargo build --release

# Image to run the final binary
FROM debian:bullseye-slim

# It's usual to set the working directory to /app
WORKDIR /app

# Only copy the final binary from the build stage
# The binary is located at /app/target/release/my_webapp, 
#   since we are using the release profile.
COPY --from=base /target/release/my_webapp /app/my_webapp

# Finally, we run the binary
CMD ["./my_webapp"]
```
其中，my_webapp是我的软件的名称，需要根据实际情况修改。

## Step2 构建Docker镜像
构建Docker镜像的命令是
```
docker buildx build [OPTIONS] PATH | URL | -
```
对于我的软件，则是
```
docker buildx build -t my_webapp:v0.1 .
```
（注意：这里的“.”表示当前目录，即Dockerfile所在的目录，容易漏掉）

## Step3 运行Docker镜像
```shell
docker run -d -p 8888:8888 --name my_webapp my_webapp:v0.1
```
curl访问可正常输出

## Step4 更多操作
### 1. 构建镜像的耗时优化
#### 针对编译的优化
在Step1的Dockerfile中，每次构建镜像都会重新编译整个项目，这样会浪费很多时间。

根据链接[https://depot.dev/blog/rust-dockerfile-best-practices](https://depot.dev/blog/rust-dockerfile-best-practices)，进行以下优化：
* 使用 cargo-chef 缓存第三方依赖项
* 使用 sccache 缓存 Rust 项目编译
* 缓存 Cargo 注册表
从而做到利用未更改的部分，跳过步骤以加快构建速度。
```Dockerfile
# Image pre-built from the official Rust image
# base on the Debian Bullseye slim image
FROM rust:1.83.0-slim-bullseye AS base

# Install necessary dependencies
RUN apt-get update && apt-get install -y \
    libssl-dev \
    pkg-config

# Install sccache and cargo-chef
RUN cargo install sccache --version ^0.7
RUN cargo install cargo-chef --version ^0.1

# Set environment variables to use sccache as the RUSTC_WRAPPER
ENV RUSTC_WRAPPER=sccache SCCACHE_DIR=/sccache

# Set OPENSSL_DIR to the root directory containing include and lib
ENV OPENSSL_DIR=/usr

# Planner stage: Generate the cargo-chef recipe
FROM base AS planner
WORKDIR /app
COPY ./Cargo.toml ./Cargo.toml
COPY ./src ./src
# Use BuildKit to cache the sccache directory
RUN --mount=type=cache,target=$SCCACHE_DIR,sharing=locked \
    cargo chef prepare --recipe-path recipe.json

# Builder stage: Build the project using the recipe
FROM base AS builder
WORKDIR /app
COPY --from=planner /app/recipe.json recipe.json
# Use BuildKit to cache the Cargo registry and sccache directories
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=$SCCACHE_DIR,sharing=locked \
    cargo chef cook --release --recipe-path recipe.json
COPY ./Cargo.toml ./Cargo.toml
COPY ./src ./src
# Use BuildKit to cache the Cargo registry and sccache directories for the final build
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=$SCCACHE_DIR,sharing=locked \
    cargo build --release

# Final runtime image based on debian:bullseye-slim
FROM debian:bullseye-slim
WORKDIR /app
COPY --from=builder /app/target/release/my_webapp /app/my_webapp

# Finally, we run the binary
CMD ["./my_webapp"]
```

#### 针对下载的优化
镜像源或者挂代理。建议挂代理。

### 2. 更多运行参数
增加-d参数，使容器在后台运行，不影响终端的使用。

docker ps命令可以查看所有正在运行的容器的信息。

### 3. 容器网络互访
容器实例默认启动在 bridge 网络上，以下是我的两个容器的IP地址：
```shell
#my_webapp
$ docker inspect c01d82081904 | grep IPAddress
#输出
"SecondaryIPAddresses": null,
"IPAddress": "172.17.0.3",

#swagger_editor
$ docker inspect 6d697d21a3d9 | grep IPAddress
#输出
"SecondaryIPAddresses": null,
"IPAddress": "172.17.0.2",
```
通过bridge网络直接在swagger editor的容器内访问webapp容器的服务
```shell
$ docker exec -it 6d697d21a3d9 curl 172.17.0.3:8888/echo/fluffilyn
#输出
Hello, fluffilyn
```
