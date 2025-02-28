# [](#p-1425-week-3-lab-openfaas-on-macos-1)Week 3 Lab: OpenFaaS on MacOS

为什么我要用mac搞这玩意？累死我了。。。

## [](#p-1425-step-1faasd-2)Step 1：搭建faasd环境

我没有用实验室服务器是因为它不支持arm架构下编译的程序，所以我选择了在MacOS上搭建本地faasd环境。

### [](#p-1425-faasd-3)安装faasd

[faasd安装教程](https://github.com/openfaas/faasd/blob/master/docs/MULTIPASS.md)

根据这个教程，我们使用multipass创建一个虚拟机，然后在虚拟机中安装faasd。

1、 获取[multipass]（https://multipass.run/），注意要macOS版本。

2、 获取教程里的脚本`cloud-config.txt`

```shell
curl -sSLO https://raw.githubusercontent.com/openfaas/faasd/master/cloud-config.txt
```

3、 输入以下命令创建虚拟机

```shell
multipass launch --name faasd
```

* 注：没有按照教程里的`--cloud-init cloud-config.txt`是因为这个脚本不起效。

进入虚拟机

```shell
multipass shell faasd
```

4、打开**主机**里的`clout-config.txt`，复制里面的内容，然后在**虚拟机**里依次输入以下命令，运行faasd的安装脚本，并将密码复制到虚拟机里比较方便的位置：

```shell
curl -sfL https://raw.githubusercontent.com/openfaas/faasd/master/hack/install.sh | bash -s -

curl -sSLf https://cli.openfaas.com | sh

journalctl -u faasd --no-pager

cat /var/lib/faasd/secrets/basic-auth-password | /usr/local/bin/faas-cli login --password-stdin
```

* **注意**：如果遇到`raw.githubusercontent.com:443: Connection refused`，可能是dns污染导致该地址被重定向至本地ip，可以去ip查询地址查询该网站的真正ip，手动修改虚拟机的`/etc/hosts`文件，并添加以下内容：
  ```undefined
  185.199.108.133 raw.githubusercontent.com
  ```
* 如果脚本莫名其妙中断了，也可能是`github.com`遇到了相同问题，还是根据相同的方法修改`/etc/hosts`文件。

出现以下字样，说明安装成功：

```bash
Check status with:
  sudo journalctl -u faasd --lines 100 -f

Login with:
  sudo -E cat /var/lib/faasd/secrets/basic-auth-password | faas-cli login -s
+ install_caddy
+ '[' '!' -z '' ']'
+ echo 'Skipping caddy installation as FAASD_DOMAIN.'
Skipping caddy installation as FAASD_DOMAIN.
```

然后，你可以把`/var/lib/faasd/secrets/basic-auth-password`文件里的密码复制到主机里，后续会用到它。

### [](#p-1425-faasd-4)登录faasd

现在我们回到主机，登录faasd。

1、输入以下命令查看虚拟机的ip地址：

```undefined
multipass info faasd
```

```yaml
Name:           faasd
State:          Running
Snapshots:      0
IPv4:           192.168.64.5 # 这个是虚拟机的ip地址
                10.62.0.1
Release:        Ubuntu 24.04.2 LTS
Image hash:     d9d6d691ba22 (Ubuntu 24.04 LTS)
CPU(s):         1
Load:           0.00 0.03 0.03
Disk usage:     2.8GiB out of 4.8GiB
Memory usage:   329.1MiB out of 952.9MiB
Mounts:         --
```

2、将OPENFAAS\_URL设置为虚拟机的ip地址

```shell
export OPENFAAS_URL=http://192.168.64.5:8080
```

3、主机登录faasd

```shell
cat basic-auth-password | faas-cli login -s
```

出现以下字样，说明登录成功：

```shell
credentials saved for admin http://192.168.64.5:8080
```

## [](#p-1425-step-2-5)Step 2：拉取模板、创建函数、编写源码

应要求，使用万能的R门：

### [](#p-1425-h-6)拉取模板并创建函数

我们先创建并进入目录`fn-echo-rs`，然后拉取模板：

```shell
mkdir fn-echo-rs && cd fn-echo-rs
faas-cli template pull https://github.com/openfaas-incubator/rust-http-template
```

然后创建自己的函数：

```shell
faas-cli new --lang rust-http my-echo
```

现在的目录结构如下：

```cpp
fn-echo-rs
├── my-echo
│   │
│   │   
├── template
│   ├── rust
│   └── rust-http
└── stack.yaml
...
```

### [](#p-1425-h-7)编写源码

我使用了较老版本的hyper库，根据官网的[旧版教程 1](https://hyper.rs/guides/0.14/server/hello-world/)，需要修改rust-http模板的`main.rs`:

* `cargo.toml`

```ini
[package]
name = "main"
version = "0.1.0"
authors = ["Piotr Roslaniec <p.roslaniec@gmail.com>"]
edition = "2018"

[dependencies]
handler = { path = "../function" }
hyper = { version = "0.14", features = ["full"] }
tokio = { version = "1", features = ["full"] }
pretty_env_logger = "0.4"
```

* `main.rs`

```rust
use std::convert::Infallible;

use hyper::service::{make_service_fn, service_fn};
use handler::echo;

#[tokio::main]
pub async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    pretty_env_logger::init();

    // For every connection, we must make a `Service` to handle all
    // incoming HTTP requests on said connection.
    let make_svc = make_service_fn(|_conn| {
        // This is the `Service` that will handle the connection.
        // `service_fn` is a helper to convert a function that
        // returns a Response into a `Service`.
        async { Ok::<_, Infallible>(service_fn(echo)) }
    });

    let addr = ([0, 0, 0, 0], 3000).into();

    let server = Server::bind(&addr).serve(make_svc);

    println!("Listening on http://{}", addr);

    server.await?;

    Ok(())
}
```

然后，开始编写我们创建的my-echo函数。我实现了三个功能：

1. GET请求`/`路径返回一些说明
2. POST请求`/`路径返回客户端传入的数据
3. GET请求`/randInt`路径返回一个1-100的随机数

* `cargo.toml`

```ini
[package]
name = "handler"
version = "0.1.0"
authors = ["Piotr Roslaniec <p.roslaniec@gmail.com>"]
edition = "2018"

[dependencies]
hyper = { version = "0.14", features = ["full"] }
tokio = { version = "1", features = ["full"] }
futures = "0.3"
futures-util = "0.3"
rand = "0.8"
```

* `lib.rs`

```rust
use hyper::{Body, Method, Request, Response, StatusCode};

/// This is our service handler. It receives a Request, routes on its
/// path, and returns a Future of a Response.
pub async fn echo(req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
    match (req.method(), req.uri().path()) {
        // Serve some instructions at /
        // $ curl http://gateway.openfaas.local/function/my-echo, then you will see the instructions.
        // Notice that /my-echo is the root path of the function.
        (&Method::GET, "/") => Ok(Response::new(Body::from(
            "Try POSTing data to /my-echo such as: `curl http://192.168.64.5:8080/function/my-echo/echo -X POST -d 'write something here'`",
        ))),

        // Echo client's ipaddr back to the client.
        (&Method::POST, "/") => {
            // 读取请求体数据
            let whole_body = hyper::body::to_bytes(req.into_body()).await?;
            let body_str = String::from_utf8(whole_body.to_vec()).unwrap_or_else(|_| "Invalid UTF-8".to_string());

            let response_body = format!("hello, you posted: {}", body_str);
            Ok(Response::new(Body::from(response_body)))
        },

        (&Method::GET, "/randInt") => {
            use rand::Rng;
            let mut rng = rand::thread_rng();
            let rand_int = rng.gen_range(1..=100);
            let returnstr = format!("Random number: {}", rand_int); 
            Ok(Response::new(Body::from(returnstr)))
        },

        // Return the 404 Not Found for other routes.
        _ => {
            let mut not_found = Response::default();
            *not_found.status_mut() = StatusCode::NOT_FOUND;
            Ok(not_found)
        }
    }
}
```

编写完源码，还要编写`stack.yaml`文件：

```yaml
version: 1.0
provider:
  name: openfaas
  gateway: http://gateway.openfaas.local # 这里改为你的faasd虚拟机的ip地址
functions:
  my-echo:
    lang: rust-http
    handler: ./my-echo
    image: fluffilyn/my-echo:latest # dockerhub用户名/函数名:版本
```

## [](#p-1425-step-3build-push-and-deploy-8)Step 3：构建、推送和部署（build, push and deploy）

### [](#p-1425-h-9)构建

在**MacOS**中编译，由于Alpine Linux缺少某些工具链，需要修改`rust-http`目录下的Dockerfile：

1、修改rust版本为1.70：

```
FROM ghcr.io/openfaas/of-watchdog:0.9.11 as watchdog

FROM rust:1.70-alpine as builder

WORKDIR /home/rust
```

2、在`WORKDIR/home/rust`后面添加如下内容

```
# Install musl-dev package
RUN apk add --no-cache musl-dev build-base
RUN rustup target add aarch64-unknown-linux-musl
```

3、将目标编译平台改为`aarch64-unknown-linux-musl`：

```
RUN --mount=type=cache,target=/usr/local/cargo/registry cargo build --target aarch64-unknown-linux-musl --release
```

然后，输入以下命令开始构建（请**先登录Dockerhub**！！）

```shell
DOCKER_BUILDKIT=1 faas-cli build
```

输出以下字样，说明构建成功：

```shell
Image: fluffilyn/my-echo:latest built.
[0] < Building echo done in 37.05s.
[0] Worker done.

Total build time: 37.05s
```

* 如果下载失败，你可能需要挂代理或者找镜像源。

### [](#p-1425-h-10)推送

确保你在之前的步骤中登录了faasd，然后输入以下命令推送：

```shell
faas-cli push -f stack.yaml
```

出现以下字样，说明推送成功：

```shell
[0] < Pushing my-echo [fluffilyn/my-echo:latest] done.
```

### [](#p-1425-h-11)部署

```shell
$ faas-cli deploy
```

出现以下字样，说明部署成功：

```shell
Deploying: my-echo.
WARNING! You are not using an encrypted connection to the gateway, consider using HTTPS.

Deployed. 202 Accepted.
URL: http://192.168.64.5:8080/function/my-echo
```

## [](#p-1425-step-4-12)Step 4：调用

我们可以使用curl命令调用函数。默认的方法是GET。

```shell
curl http://192.168.64.5:8080/function/my-echo
```

输出结果：

```bash
Try POSTing data to /my-echo such as: `curl http://gateway.openfaas.local/function/my-echo -X POST -d 'write something here'`
```

那么根据提示，输入

```shell
curl http://192.168.64.5:8080/function/my-echo/echo -X POST -d '这是一段文字'
```

输出结果：

```yaml
hello, you posted: 这是一段文字
```

最后，我们再调用一下`/randInt`路径：

```shell
curl 192.168.64.5:8080/function/my-echo/randInt
```

输出结果：

```yaml
Random number: 42
```

结束。
