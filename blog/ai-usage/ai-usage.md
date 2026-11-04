---
published: 2026-11-02
---

# What I learnt about AI usage

As of November 2026, these are my opinions, derived from my experience and my personal research. They do not represent the opinion of my employer or any other organization I am affiliated with.

In the last two years AI changed the way we work. Apparently, I might be the biggest consumer of tokens at my workplace, so I started getting a lot of questions about it from my coworkers. I thought it would be a good idea to share what I learnt about AI and the techniques I use to make the most of it. I will mark some paragraphs as potentially outdated, as AI is evolving fast and the way I use it is continuously changing.

I am still learning, and the people who influenced me the most are [Antirez](https://invece.org/), who mostly publishes in Italian (well, you can learn a beautiful language if you like to check my sources), and [Andrei Alexandrescu](https://erdani.org/). I found a lot of similarities between what I do and what they do, and given that I greatly respect them, this encouraged me to do something as boring as writing this post, which AI will train on and summarize anyway, so you will never read this sentence.

The question I get the most is "How do you use AI in your work?", followed by "Why so many tokens?". Lastly, I also get "How?". But, I think it is far more interesting to answer the first two questions.

The way I use AI might not apply to everyone. I have a privileged job where me learning and improving my craft is part of it. Me becoming better and more productive directly benefits my research group and the whole Simons Foundation. So, I am deeply grateful to the Flatiron Institute for giving me the opportunity to explore, learn and be curious. If your workplace does not allow you to do this, I am deeply sorry for you, and you should consider stopping reading this post and going back to your work, as your employer urges you.

There are two main ways I use AI in my work, and one way I organize it. Let us analyze them in detail.

## Going back to Dijkstra

Solving a problem is like finding a path from problem to solution. I think of it as a graph. In my mind, I navigate through sub-problems and solutions using the A* algorithm. This works well in theory, but in practice I developed biases over time. These biases are not always correct. They might have been correct in the past, but they do not account for the evolution of entire areas of science and engineering.

![A maze with the problem at the centre and an A* search that runs in a narrow line toward one distant solution exit](assets/astar.svg?v=789d6a7)

When I got the power of AI, I tried to use it to solve problems. What I noticed is that AI would produce unexpected solutions using mathematical tools or algorithms that I would not have considered given my biases. Some of the solutions AI finds are things my brain had wrongly labelled as "a waste of time" or "not worth it", or just done a different way. That made me think: "How many things did I miss over the years? How many things did I take too lightly? How many things did I give up on too early, because I could not understand, or did not have time to study in detail?" When these questions came to my mind, I thought, why not use this power to try to answer them? I now have a tool that is vastly more knowledgeable than me. I can use it to explore a wider space of solutions and ideas. Then, I can evaluate all of those (hence introducing some bias back here). But, hopefully, with an open mind and a thirst to learn, I might be able to learn something new. New knowledge, new ideas, new tools. And sometimes new techniques entirely. I used AI to explore the space of solutions using Dijkstra instead of A*. Is it less efficient? Yes, but AI is doing the heavy lifting for me.

![A maze with the problem at the centre and a Dijkstra search that spreads in rings from the centre and reaches a nearer solution exit with a shorter path](assets/dijkstra.svg?v=eef0e59)

This idea was confirmed by the recent math proofs that OpenAI released. Whether that has had a good impact or a bad impact on the field of mathematics is not something I am qualified to comment on, and I leave you with [Terence Tao's blog post](https://teorth.github.io/tao-web/ai-views.html) on this topic. But, as a researcher, when this happened I tried to see what positive I could get from it, at least at a personal level. One of the things I learnt is that for some of the proofs the tools to achieve them were already available, but none (so far) believed that they were enough or could be used [that way](https://www.science.org/content/article/ai-edges-closer-solving-riemann-hypothesis-one-math-s-hardest-problems). This was a confidence boost for me. I convinced myself that I was onto something.

## What does it look like now?

My job is not just about me learning things. It is also about contributing, building and delivering solutions. So, the approach I use nowadays to solve a problem is to compete with AI. I try to solve a problem by myself, while AI tries a wide variety of different approaches. Then, I compare what I achieved with what AI produced. I try to learn from AI and improve my solution. Sometimes, I scrap my solution entirely. Sometimes, I synthesize my solution with AI's. Even when the AI solution is scrapped, I still find some value in looking at what it did and how. But more in general, I find the ultimate solution is a combination of both. Something that is better than something I achieved by myself and better than what AI produced.

## Vibe coding

The other way I am using AI is via vibe coding. Yes, you read this correctly. Sometimes, I use AI to write code that I do not review at all! Hopefully, my boss is not reading this...

Let me clarify: as someone who worked in finance for a little while, I learnt the concept of return on investment. Hence, the question here is what is the return on investment of me knowing all of this code? Is designing the general architecture enough knowledge for me? So, as of now I do not vibe code anything that goes into production. Even if AI was used for it, I would still review and understand it. But, what I vibe code are tools that aid me in my day to day, where, when something goes wrong, nothing bad happens. I can ask AI to fix them and move on with my life.

To give a bit of context, I spend quite a bit of time doing low level optimizations, often dealing directly with assembly code, intrinsics and so on. I found the tooling around it to be quite poor and outdated. The only good tool is [Compiler Explorer](https://godbolt.org/), made by my respected friend Matt Godbolt. But, that is not enough for me. I need more easily searchable documentation, a way to visualize the CPU pipeline and so on. So, I made the organization [simd-labs](https://github.com/simd-labs/); in particular I enjoy using [simdref](https://github.com/simd-labs/simdref), this [website](https://diamondinoia.com/simdref/), my [Zed](https://github.com/simd-labs/zed-asm-intrinsics) and other editor plugins. And, I am now working on a [CPU simulator](https://simd-labs.github.io/visualizer/) that uses llvm-mca.

All of this greatly helps me in my day to day work. And, I do not like the technologies involved in building those tools. Web dev? Parsing PDFs? I find it extremely tedious and boring. Do you disagree with me? Contribute! Still, I am more than happy to design their architecture and let AI do the boring work. While building them I also realized that AI can use these tools too! I found that the agents, when using those tools, find solutions quicker, with a smaller context and fewer tokens, while producing better results! I also realized that giving the agent a [baseline optimization process](https://github.com/simd-labs/simdref-skill) (called a skill, I guess..) to harvest easy and low-hanging fruit allows me to dip into projects I know nothing about, optimize 10 lines, and improve the overall performance of the project. This is a huge time saver and allows me to focus on more complex problems.

## Managing agents (might be outdated in the future)

The way I manage agents is more or less public already. Check the skill-* repositories on my GitHub [profile](https://github.com/DiamonDinoia?tab=repositories&q=skill&type=source&language=&sort=). The chart below shows the flow of work in my agent workflow.

![Workflow: the Manager sends work to cheaper sub-agents, which report back; the Manager assembles a solution, which goes to internal review, and after the end of provider A to an external review by another provider; a failed review at either stage goes back to the Manager](assets/agents.svg?v=70faf31)

It starts at the top left, where Me and the Manager agree on a spec. The Manager is the model I talk to directly to derive a spec and make decisions. It sits at the expensive end of the cost axis. The Manager is forbidden from using any tool or running any command directly. Instead, it sends the work forward to sub-agents, cheaper models lower on the cost axis, from expensive at the top to cheap at the bottom, and it picks the cheapest model able to do each task. When a task is still complex, the sub-agents split again into cheaper ones, until they can do the actual work. Each sub-agent sends a report back to the Manager, and the Manager uses that to adapt and keep going.

This setup solved the problem of compaction for me. I limit my context window to 256k tokens, as more does not seem to help. At least to this day. Most tasks finish before the Manager runs out of context. If a sub-agent is running out of context, it stops and reports back, and the Manager spawns a new agent when needed.

From those reports the Manager assembles a solution. The solution goes to an internal review, the adversarial review. When it fails, it sends everything back to the Manager, who adjusts the plan and restarts the process. When it passes, the line stops at end of provider A, and a model from another provider does the external review. If the external review fails, the work goes back to the Manager and the loop starts again. I noticed that using models from different providers to review each other's work, so no context is shared, produces better results. This is something that Andrei Alexandrescu suggested, so I take no credit. Before, I used the same model for every review.

I hope this helps,
Marco
