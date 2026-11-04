package com.backend.docmind.exception;

import ch.qos.logback.core.pattern.util.RegularEscapeUtil;

public class ResourceNotFoundException extends RuntimeException{

    public ResourceNotFoundException()
    {
        super("Resource You are looking is not found");
    }
    public ResourceNotFoundException(String message)
    {
        super(message);
    }
    public ResourceNotFoundException(String m , Throwable ex)
    {
        super(m ,ex);
    }

}
