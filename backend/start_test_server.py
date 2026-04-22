import uvicorn

uvicorn.run("test_interface_alt:app", host="0.0.0.0", port=8005, reload=False)
