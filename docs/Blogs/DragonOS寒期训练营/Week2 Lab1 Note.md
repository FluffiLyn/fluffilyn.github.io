# 为DragonOS添加一个系统调用
1. 首先找到`kernel/src/arch/x86_64/syscall/nr.rs`，添加一个系统调用号：
```rs
pub const SYS_ADD: usize = 100004;
```
（一开始没注意到这个文件，仅在在`mod.rs`里添加了系统调用号，导致系统找不到这个号直接panic了）

2. 然后找到`kernel/src/syscall/mod.rs`，添加相同的系统调用号，并添加一个系统调用处理函数：
```rs
SYS_ADD => {
    // 暂时不检查参数合法性
    let a = args[0];
    let b = args[1];
    Ok(a + b)
}
```

3. 在`user/apps`中创建用户程序`cargo new test_SYS_ADD`，测试新的系统调用：
```rs
extern crate libc;
use std::ffi::CString;
use libc::{syscall, SYS_exit};

fn main() {
    let test_cases = vec![
        (5, 7, 12),
        (10, 20, 30),
        (-5, 5, 0),
        (0, 0, 0),
        (i32::MAX, 0, i32::MAX),
        (i32::MIN, 0, i32::MIN),
    ];

    for (num1, num2, expected) in test_cases {
        unsafe {
            // 使用 syscall 来调用系统调用 100004
            let result: i32 = syscall(100004, num1, num2) as i32;
            println!("syscall(SYS_ADD): ADD {} + {} =  {}", num1, num2, result);
            // 使用 assert 来验证返回结果
            assert_eq!(result, expected, "System call returned incorrect result!");

            println!("System call returned correct result: {}", result);
        }
    }
}
```
记得在`Cargo.toml`中添加libc依赖。

4. 在`user/dadk/config`目录下添加新的用户程序配置文件`test_SYS_ADD.toml`，通过`dadk`构建用户程序：
```toml
# 用户程序名称
name = "test_SYS_ADD"

# 版本号
version = "0.1.0"

# 用户程序描述信息
description = "Test SYS_ADD"

# （可选）默认: false 是否只构建一次，如果为true，DADK会在构建成功后，将构建结果缓存起来，下次构建时，直接使用缓存的构建结果
build-once = false
#  (可选) 默认: false 是否只安装一次，如果为true，DADK会在安装成功后，不再重复安装
install-once = false

# 目标架构
# 可选值："x86_64", "aarch64", "riscv64"
target-arch = ["x86_64"]

# 任务源
[task-source]
# 构建类型
# 可选值："build-from_source", "install-from-prebuilt"
type = "build-from-source"
# 构建来源
# "build_from_source" 可选值："git", "local", "archive"
# "install_from_prebuilt" 可选值："local", "archive"
source = "local"
# 路径或URL
source-path = "user/apps/test_SYS_ADD"

# 构建相关信息
[build]
# （可选）构建命令
build-command = "make install"

# 安装相关信息
[install]
# （可选）安装到DragonOS的路径
in-dragonos-path = "/"

# 清除相关信息
[clean]
# （可选）清除命令
clean-command = "make clean"

# （可选）依赖项
# 注意：如果没有依赖项，忽略此项，不允许只留一个[[depends]]
```

5. 在用户程序的文件夹下创建`Makefile`文件：
```makefile
TOOLCHAIN="+nightly-2024-11-05-x86_64-unknown-linux-gnu"
RUSTFLAGS+=""

ifdef DADK_CURRENT_BUILD_DIR
# 如果是在dadk中编译，那么安装到dadk的安装目录中
	INSTALL_DIR = $(DADK_CURRENT_BUILD_DIR)
else
# 如果是在本地编译，那么安装到当前目录下的install目录中
	INSTALL_DIR = ./install
endif

ifeq ($(ARCH), x86_64)
	export RUST_TARGET=x86_64-unknown-linux-musl
else ifeq ($(ARCH), riscv64)
	export RUST_TARGET=riscv64gc-unknown-linux-gnu
else 
# 默认为x86_86，用于本地编译
	export RUST_TARGET=x86_64-unknown-linux-musl
endif

run:
	RUSTFLAGS=$(RUSTFLAGS) cargo $(TOOLCHAIN) run --target $(RUST_TARGET)

build:
	RUSTFLAGS=$(RUSTFLAGS) cargo $(TOOLCHAIN) build --target $(RUST_TARGET)

clean:
	RUSTFLAGS=$(RUSTFLAGS) cargo $(TOOLCHAIN) clean --target $(RUST_TARGET)

test:
	RUSTFLAGS=$(RUSTFLAGS) cargo $(TOOLCHAIN) test --target $(RUST_TARGET)

doc:
	RUSTFLAGS=$(RUSTFLAGS) cargo $(TOOLCHAIN) doc --target $(RUST_TARGET)

fmt:
	RUSTFLAGS=$(RUSTFLAGS) cargo $(TOOLCHAIN) fmt

fmt-check:
	RUSTFLAGS=$(RUSTFLAGS) cargo $(TOOLCHAIN) fmt --check

run-release:
	RUSTFLAGS=$(RUSTFLAGS) cargo $(TOOLCHAIN) run --target $(RUST_TARGET) --release

build-release:
	RUSTFLAGS=$(RUSTFLAGS) cargo $(TOOLCHAIN) build --target $(RUST_TARGET) --release

clean-release:
	RUSTFLAGS=$(RUSTFLAGS) cargo $(TOOLCHAIN) clean --target $(RUST_TARGET) --release

test-release:
	RUSTFLAGS=$(RUSTFLAGS) cargo $(TOOLCHAIN) test --target $(RUST_TARGET) --release

.PHONY: install
install:
	RUSTFLAGS=$(RUSTFLAGS) cargo $(TOOLCHAIN) install --target $(RUST_TARGET) --path . --no-track --root $(INSTALL_DIR) --force
```

6. 最后在DragonOS目录下运行`make build`，然后重启系统，运行`cd bin && ./test_SYS_ADD`，测试效果：
```
root@DragonOS:/$ cd bin && ./test_SYS_ADD
syscall(SYS_ADD): ADD 5 + 7 =  12
System call returned correct result: 12
syscall(SYS_ADD): ADD 10 + 20 =  30
System call returned correct result: 30
syscall(SYS_ADD): ADD -5 + 5 =  0
System call returned correct result: 0
syscall(SYS_ADD): ADD 0 + 0 =  0
System call returned correct result: 0
syscall(SYS_ADD): ADD 2147483647 + 0 =  2147483647
System call returned correct result: 2147483647
syscall(SYS_ADD): ADD -2147483648 + 0 =  -2147483648
System call returned correct result: -2147483648
```
