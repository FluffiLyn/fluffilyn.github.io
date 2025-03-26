# Proposal for GSoC 2025 KDE: Implementing libzip in KArchive
## Project Introduction
KArchive provides classes for easy reading, creation and manipulation of "archive" formats like ZIP and TAR. It also provides transparent compression and decompression of data.

### Problem
Current implementation for handling zip files uses non-standard logic to read zip files, so it gets confused when it finds token markers in what it is actual compressed data. This leads to issues like [bug 450597](https://bugs.kde.org/show_bug.cgi?id=450597).

### Project Goals
1. Rewrite the existing implementation in kzip.cpp using libzip:
  * Support for all existing kzip features
  * Add new features like support for encrypted zip files（optional）
2. Add new tests on kzip.cpp to ensure no regressions:
  * Basic operations
  * Edge cases
3. Document the new implementation:
  * API documentation
  * Migration guide for applications using KArchive

### Implementation & Deliverables (todo)
Various refined features will be implemented as follows:

1. Encapsulate libzip in a new class to provide a clean interface, and implement all existing features in kzip.cpp.
  * (todo)

2. 

<!--要详细。描述您计划执行哪些作来解决您在上面定义的问题。包括技术详细信息，表明您了解该技术。合理详细地说明您提议的解决方案的关键技术要素。包括在整个编码期间编写单元测试以及代码文档。这些关键要素不能留到计划的最后几周。如果需要用户文档，或者 apidox 等，这些应该在每周编写，而不是在结束时编写。-->

## Timeline (todo)

<!--表明您了解问题，有解决方案，已将其分解为可管理的部分，并且您对如何实现目标有一个现实的计划。在这里，您设定了期望，因此不要做出无法兑现的承诺。一个适度、现实和详细的时间表比承诺不可能的事情要好。你的时间表应该很详细;每周，正是您每周计划做的事情。

如果您在 GSoC 期间有其他承诺，例如工作、假期、考试、实习、研讨会或要写的论文，请在此处披露。GSoC 应该被视为一份全职工作，我们预计在编码周期的一半内每周大约工作 40 小时，或在整个持续时间内工作 20 小时。如果有冲突，请说明您将如何解决它们。如果发现存在未披露的冲突，则可能会失败。

开放和清晰的沟通至关重要。在您的提案中包括您的沟通计划;如果可能的话，每天一次。您需要每周发起正式沟通，例如在 KDE Planet 上发布博客文章或向团队邮件列表发送详细的电子邮件。缺乏沟通会导致您失败。-->


## About Me
### Contact Information
**Name**: Jimmy Lin
**Email**: fluffilyn114514@gmail.com
**Major**: Software Engineering
**Timezone**: Shanghai, China (GMT+8)

### Education & Background
I am a student at the South China University of Technology, majoring in Software Engineering. I have two years of experience in using C++ and Linux. Love code, love technology and the spirit of open source, spend many hours a week learning C++ and relevant technologies. I am enthusiastic to contribute to KDE and be a part of the community. 

### Contributions to KDE
* [framework/KArchive MR !102](https://invent.kde.org/frameworks/karchive/-/merge_requests/102)
  *  Reference: Albert Astals Cid aacid@kde.org


### Others
#### 1. Are you submitting proposals to other organizations, and whether or not you would choose KDE if given the choice?

No, KDE is the **only** organization I am submitting the proposal to. If given the choice, I would choose KDE.

#### 2. Are you comfortable working independently under a supervisor or mentor who is several thousand miles away, and perhaps 12 time zones away? How will you work with your mentor to track your work? Have you worked in this style before?

Yes, I am comfortable. I will work with my mentor to track my work by daily communication (including weekends, if needed), weekly reports and so on. I haven't worked in this style before but I am confident in my ability to adapt.

#### 3. If your native language is not English, are you comfortable working closely with a supervisor whose native language is English? What is your native language, as that may help us find a mentor who has the same native language?

Sure, I am comfortable. My native language is Chinese.