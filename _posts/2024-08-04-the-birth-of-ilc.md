---
layout: post
title: The birth of ILC
date: 2024-08-04 18:27 +1000
---

I don't think I am the only one who creates a lot of ad-hoc Bash scripts and programs. Whether it be for work or for ourselves, they become part of our personal arsenal that assist with our tasks. When I begin creating a new Bash script, usually after noticing a pattern of frequent commands, I find myself beginning with the same boiler...

```bash
#!/usr/bin/env bash

set -euo pipefail

main() {
  ...
}

main "$@"
```

Nothing out of the ordinary here but when I add logic to parse arguments things become complicated quickly and the intention of writing a quick helper script balloons out into a small application. Not to mention that not all scripts are equal. Some may be used semi-frequently while others may go unused for stretches of time only to appear unfamiliar with their usage when the time comes to dust them off. This is why I find it is important to include usage instructions but that just adds to the effort of creating the script.

Other people may also find these scripts useful which just adds to the complexity and committment required to writing a good script. Sometimes I find the effort isn't worth it and just accept it's a quick and basic script. By the way, there is nothing wrong with this approach. Having something usable is better than not having anything at all and as it gains more usage we may invest more time to enhancing it. Overall, there are many approaches one can take.

I decided there had to an approach that offered all the aforementioned concerns and still allow me to just focus on the functionality. This is what lead me to create [ilc](https://github.com/evilmarty/ilc), a tool to allow me to scaffold a new script in a self-contained YAML file.

{% raw %}

```yaml
#!/usr/bin/env ilc
description: View my ECS clusters
inputs:
  env:
    options:
      development: dev-cluster
      staging: staging-cluster
      production: prod-cluster
env:
  AWS_DEFAULT_REGION: us-east-1
commands:
  services:
    aliases:
      - svcs
    description: Show all services in cluster
    run: |
      aws ecs list-services --cluster {{ .Input.cluster }} --output text --query 'serviceArns' | xargs -n 10 aws ecs describe-services --cluster {{ .Input.cluster }} --services
  tasks:
    aliases:
      - tsks
    description: Show all tasks in cluster
    run: |
      aws ecs list-tasks --cluster {{ .Input.cluster }} --output text --query 'taskArns' | xargs -n 100 aws ecs describe-tasks --cluster {{ .Input.cluster }} --tasks
```

{% endraw %}

I work with AWS quite a bit, especially ECS, and use `aws-cli` almost on a daily basis. This is a simplified example of some of the commands I use to inspect ECS resources. How `ilc` improves my workflow is that it handles parsing arguments so I don't have to. When I execute the script I don't need to remember any commands or inputs, it will ask me for any missing arguments. This solves having to remember what arguments are accepted or look at the help section prior to invoking the script. Speaking of the help screen, `ilc` provides that for me too. Being a self-contained YAML file means it's real easy to share with others or include in source control.

I could go on but I think you get the gist. It provides a lot of flexibility to write some very robust scripts. I will mention one more thing. It doesn't just support Bash scripts. You can write scripts in any language that is installed. Python, Ruby, Powershell, whatever you desire. All you have to do is declare your commands and inputs (aka arguments) so you can focus on the logic and leave the rest to it.

If this sounds interesting to you then give it a go! I'd love to hear what you think.
