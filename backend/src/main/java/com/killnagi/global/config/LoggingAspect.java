package com.killnagi.global.config;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
public class LoggingAspect {

    @Around("execution(* com.killnagi..*(..))")
    public Object logMethodExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        long start = System.currentTimeMillis();
        try {
            return joinPoint.proceed();
        } finally {
            long elapsed = System.currentTimeMillis() - start;
            log.debug("[{}] {} ({}ms)", className, methodName, elapsed);
        }
    }
}