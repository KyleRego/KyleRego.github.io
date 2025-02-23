---
layout: post
title: "Video and image React components"
date: 2025-02-23 01:35:00 -0800
categories: javascript
permalink: /video-image-react-components
emoji: 🕸️
mathjax: false
---

Recently I freelanced a website [David's Dead Tree Removal](https://davidtreeremoval.it.com). As it was a greenfield JavaScript React Vite app, I put in `Video` and `Image` components right away:

{% highlight javascript %}{% raw %}
export default function Video({src, w, caption}) {
    return <div title={caption}>
            <video style={{width: w}} autoPlay loop muted playsInline>
                <source src={src} type="video/mp4" />
            </video>
            <p>
                {caption}
            </p>
        </div>;
}
{% endraw %}{% endhighlight %}

and 

{% highlight javascript %}{% raw %}
export default function Image({src, text: caption, w}) {
    return <figure title={caption} style={{width: w}}>
        <img style={{maxWidth: "100%"}} src={src} />

        <figcaption>
            {caption}
        </figcaption>
    </figure>;
}
{% endraw %}{% endhighlight %}

There is an issue with the `Video` component where on my Android phone sometimes the video orients itself wrong, I think it may be a browser environment issue. This was for a use case where I did not want video controls or play to start on the video as it is like a business marketing website and I have found that for an IT business website, it is a cool initial impression for a video to play quickly. 