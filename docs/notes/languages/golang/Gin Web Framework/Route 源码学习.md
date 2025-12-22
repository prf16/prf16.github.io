---
title: Route 源码学习
createTime: 2025/09/04 15:22:56
permalink: /languages/golang/Gin Web Framework/Route 源码学习/
---

:::: steps
1. 入口

    ```go title="main.go" twoslash
    package main

    import (
        "github.com/gin-gonic/gin"
    )

    func main() {
        r := gin.Default()
        r.GET("/ping", func(c *gin.Context) {
            c.JSON(200, gin.H{"message": "pong"})
        })
        _ = r.Run(":8080")
    }
   ```

2. 进入 r.Run
    ```go title="vendor/github.com/gin-gonic/gin/gin.go" twoslash
    // Run attaches the router to a http.Server and starts listening and serving HTTP requests.
    // It is a shortcut for http.ListenAndServe(addr, router)
    // Note: this method will block the calling goroutine indefinitely unless an error happens.
    func (engine *Engine) Run(addr ...string) (err error) {
        defer func() { debugPrintError(err) }()

        if engine.isUnsafeTrustedProxies() {
            debugPrint("[WARNING] You trusted all proxies, this is NOT safe. We recommend you to set a value.\n" +
                "Please check https://pkg.go.dev/github.com/gin-gonic/gin#readme-don-t-trust-all-proxies for details.")
        }

        address := resolveAddress(addr)
        debugPrint("Listening and serving HTTP on %s\n", address)

        // gin 底层是基于 net/http 标准库封装开发，作为网络通信的基础组件 // [!code ++]
        err = http.ListenAndServe(address, engine.Handler())
        return
    }
   ```

3. 步骤 3

   ```go title="net/http/server.go" twoslash
    // ListenAndServe listens on the TCP network address addr and then calls
    // [Serve] with handler to handle requests on incoming connections.
    // Accepted connections are configured to enable TCP keep-alives.
    //
    // The handler is typically nil, in which case [DefaultServeMux] is used.
    //
    // ListenAndServe always returns a non-nil error.

    // Args: 
    //     :param addr 监听的 TCP 地址（IP:端口）
    //     :param handler 接口类型
    func ListenAndServe(addr string, handler Handler) error {
        server := &Server{Addr: addr, Handler: handler}
        return server.ListenAndServe()
    }
   ```

4. 结束
::::
