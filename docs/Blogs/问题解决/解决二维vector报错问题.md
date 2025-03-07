# 问题描述
系统： MacOS 
IDE： VSCode
编译器：clang++ arm64-apple-darwin24.3.0

出错代码：
```c++
vector<vector<int>> v;
```
ide会报错，提示：
```
A space is required between consecutive right angle brackets (use '> >') (fix available)
```
使用code runner插件编译运行时，会报相同错误。

# 解决思路
在网上查阅可知，c++11之前（不包括c++11）的版本，不支持`>>`这种形式的右尖括号，所以需要在两个`>`之间加一个空格。

因此，我需要将检查规则和编译器的c++标准版本调整为c++11及以上。

# 解决方法
## 1、修改检查规则
参考这篇文章：[macOS 下让 VSCode Clangd 识别 C++11 语法](https://zhuanlan.zhihu.com/p/670005031)
## 2、修改编译器的c++标准版本
打开code runner的settings文件，找到`code-runner.executorMap`，找到如下配置：
```
"cpp": "cd $dir && g++ $fileName -o $fileNameWithoutExt && $dir$fileNameWithoutExt",
```

经过测试，不声明c++标准版本时，默认使用的是c++98，所以需要在编译器的命令中添加`-std=c++11`参数，并将编译器修改为clang++：
```
"cpp": "cd $dir && g++ -std=c++11 $fileName -o $fileNameWithoutExt && $dir$fileNameWithoutExt",
```