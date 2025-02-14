---
layout: post
title: "React context to track client-side authentication state"
date: 2024-09-17 08:30:00 -0500
categories: programming csharp
permalink: /react-context-to-track-client-side-authentication-state
emoji: 😇
mathjax: false
---

A problem I encountered recently was implementing tracking if the user is logged in in a React app that is not being used within a framework. I solved the problem in my situation by utilizing a nice feature of React: a context, which I named `AuthedContext`:

{% highlight javascript %}
import { createContext } from "react";

export const AuthedContext = createContext({ authed: null, setAuthed: () => {} });
{% endhighlight %}

This sets what the default values of this context are. To make the context available in components, wrap those components in the DOM with the context with a value argument:

{% highlight javascript %}{% raw %}
const [authed, setAuthed] = useState(false);

...

return <AuthedContext.Provider value={{authed, setAuthed}}>
            <AlertContext.Provider value={{alertMessage, setAlertMessage}}>
                <UnitsContext.Provider value={{units, setUnits}}>
                    <div className="app">
                        <Nav />
                        <div className="container">
                            <div className="card shadow-sm mt-4">
                                <div className="card-body">
                                    <Outlet />
                                </div>
                            </div>

                            <Alert />
                        </div>
                    </div>
                </UnitsContext.Provider>
            </AlertContext.Provider>
        </AuthedContext.Provider> ;
{% endraw %}{% endhighlight %}

This also shows some other contexts being used, but it's just more examples of the same syntax if you haven't seen it before.

To access the context in a component, such as `<Nav />`:

{% highlight javascript %}
export default function Nav()
{
    const navigate = useNavigate();
    const { authed, setAuthed } = useContext(AuthedContext);
    const [showCollapsibleNavbar, setShowCollapsibleNavbar] = useState(false);
    const toggleCollapsibleNavbar = () => setShowCollapsibleNavbar(!showCollapsibleNavbar);

    ...
}
{% endhighlight %}

I have been using short-circuiting `&&` and the ternary operator with `authed` but I'm not sure this is a good idiom at this point:

{% highlight javascript %}{% raw %}
{authed === false
        ?
        <div className="my-4 d-flex flex-wrap justify-content-center column-gap-3 row-gap-3">
            <Link className="btn btn-outline-primary" to={"register"}>Register</Link>

            <Link className="btn btn-outline-primary" to={"login"}>Login</Link>

            <button onClick={handleCreateDemo} type="button" className="btn btn-outline-primary">
                Try it out!
            </button>
        </div>
        :
        ""
        }
{% endraw %}{% endhighlight %}

The above would be slightly shorter using the short-circuiting `&&` but it shows how you can conditionally render one of two things.

## How the authentication state is established initially

In my example application, units are fetched from a web API--an ASP.NET Core backend. If the user is unauthenticated based on cookie authentication middleware that is part of ASP.NET Core Identity, there will be a 401 Unauthorized response. (I always thought it was interesting that the annotation in ASP.NET Core that makes the user not being authenticated result in getting an "unauthorized" response is `[Authorize]`).

That can be done in a React effect, something like this in the same component that returns the {% raw %}`<AuthedContext.Provider value={{authed, setAuthed}}></AuthedContext.Provider>`{% endraw %}:

{% highlight javascript %}
    useEffect(() => {
        const unitsService = new UnitsService();

        unitsService.getUnits().then((res) => {
            setUnits(res);
            setAuthed(true);
        }).catch(error => {
            setUnits([]);
            setAuthed(false);
        })
    }, []);
{% endhighlight %}

Anyway, this shows a simple way to track the user authentication state in a React app that is not being used inside of a framework which I believe would provide you some way to do this already.

## Logging in and out

As a bonus, here is how my example logs in and out the user:

{% highlight javascript %}
const handleSubmitLogin = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get("email");
        const password = formData.get("password")

        const service = new IdentityService();
        service.postLogin(email, password).then(response => {
            if (response.ok) {
                setAuthed(true);
                navigate("/");
            }
        }).catch(error => {
            console.error(error);
        });
    };
{% endhighlight %}

{% highlight javascript %}
    function handleLogout() {
        const identityService = new IdentityService();

        identityService.postLogout().then(() => {
            setAuthed(false);
            navigate("/")
        }).catch((error) => {
            console.log(error);
        });
    }
{% endhighlight %}

## Ensuring cookies are sent by the fetch API and downloaded from the `Set-Cookie` header in the response

I found that the `credentials: "include"` part of the request argument (this is a method of `IdentityService`) is necessary for the cookie to be obtained from the `Set-Cookie` header in the response:

{% highlight javascript %}
async postLogin(email, password)
    {
        const url = `${this.backendOrigin}/login?useCookies=true`;

        const dto = {
            email: email,
            password: password
        };

        const headers = new Headers({"Content-Type": "application/json"});

        const request = new Request(url, {
            method: "POST",
            // without credentials: "include", the browser
            // ignores the Set-Cookie response header
            credentials: "include",
            headers: headers,
            body: JSON.stringify(dto)
        });

        return await fetch(request);
    }
{% endhighlight %}

The query string `?useCookies=true` I believe relates to some aspect of the ASP.NET Core Identity API.

While working out this example, I first developed [this more minimal example](https://github.com/KyleRego/react-client-auth-state) which may also be helpful. Anyway, this is how I figured out to do this, if I realize there is a more idiomatic way that may be a future blog post.
