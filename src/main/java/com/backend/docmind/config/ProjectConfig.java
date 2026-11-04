package com.backend.docmind.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProjectConfig {

    @Bean
    public OpenAPI openAPI()
    {
        return new OpenAPI()
                .info(
                        new Info()
                                .title("Docmind- AI Documnet Intelligence")
                                .description("RestAPI")
                                .version("1.0.0")
                                .contact(
                                        new Contact()
                                                .name("Docmind")
                                                .email("adarshk.swe@gmail.com")
                                                .url("http://adarshcodes.com")
                                )

                );
    }
}
