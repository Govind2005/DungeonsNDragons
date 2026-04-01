package com.example.referee;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class RefereeApplication {

	public static void main(String[] args) {
		SpringApplication.run(RefereeApplication.class, args);
	}

}
