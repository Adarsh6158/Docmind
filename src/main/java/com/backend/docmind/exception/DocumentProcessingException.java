package com.backend.docmind.exception;

import org.modelmapper.internal.bytebuddy.implementation.bytecode.Throw;

public class DocumentProcessingException extends RuntimeException{

    public DocumentProcessingException(String message)
    {
        super(message);
    }
    public DocumentProcessingException()
    {
        super("Error in processing document!!");
    }
    public DocumentProcessingException(String message, Throwable ex)
    {
        super(message, ex);
    }

}
