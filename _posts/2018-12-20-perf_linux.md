---
layout: post
title: Linux perf相关
categories: [general]
tags: [unreal, socket]
---

## perf相关

{% highlight bash %}
perf record -g -e cycles -p 1234
perf record --call-graph lbr -e cycles -p 1234
{% endhighlight %}


[火焰图](https://github.com/brendangregg/FlameGraph)
{% highlight bash %}
perf script > out.perf
./stackcollapse-perf.pl out.perf > out.folded
./flamegraph.pl out.folded > out.svg
{% endhighlight %}

## vtune相关

{% highlight bash %}
cd /opt/intel/oneapi/vtune/latest/bin64
./vtune -collect hotspots  -target-pid 1234
./vtune -report hotspots -r r000hs/
{% endhighlight %}
