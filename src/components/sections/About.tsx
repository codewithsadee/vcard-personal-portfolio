"use client";

import { Brush, Camera, Code, Database, ShieldCheck, Smartphone, Users } from "lucide-react";
import Clients from "@/components/Clients";
import Testimonials from "@/components/Testimonials";
import { profile, services } from "@/lib/data";

export default function About() {
    const icons = {
        design: Brush,
        dev: Code,
        app: Smartphone,
        photo: Camera,
        data: Database,
        leadership: Users,
        systems: ShieldCheck,
    } as const;

    return (
        <>
            <header>
                <h2 className="h2 article-title">About me</h2>
            </header>

            <section className="about-text">
                {profile.about.map((p) => (
                    <p key={p}>{p}</p>
                ))}
            </section>

            <section className="service">
                <h3 className="h3 service-title">What I’m doing</h3>

                <ul className="service-list">
                    {services.map((service) => {
                        const Icon = icons[service.icon];
                        return (
                            <li className="service-item" key={service.title}>
                                <div className="service-icon-box">
                                    <Icon size={36} aria-hidden="true" />
                                </div>

                                <div className="service-content-box">
                                    <h4 className="h4 service-item-title">{service.title}</h4>
                                    <p className="service-item-text">{service.description}</p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </section>

            <Testimonials />
            <Clients />
        </>
    );
}
