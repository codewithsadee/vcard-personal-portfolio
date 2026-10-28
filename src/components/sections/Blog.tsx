"use client";

import Image from "next/image";
import { blogPosts } from "@/lib/data";

const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
};

export default function Blog() {
    if (blogPosts.length === 0) {
        return null;
    }

    return (
        <>
            <header>
                <h2 className="h2 article-title">Blog</h2>
            </header>

            <section className="blog-posts">
                <ul className="blog-posts-list">
                    {blogPosts.map((post) => (
                        <li className="blog-post-item" key={post.title}>
                            <a href="#">
                                <figure className="blog-banner-box">
                                    <Image
                                        src={post.image}
                                        alt={post.title}
                                        width={640}
                                        height={400}
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                </figure>

                                <div className="blog-content">
                                    <div className="blog-meta">
                                        <p className="blog-category">{post.category}</p>
                                        <span className="dot"></span>
                                        <time dateTime={post.date}>{formatDate(post.date)}</time>
                                    </div>

                                    <h3 className="h3 blog-item-title">{post.title}</h3>
                                    <p className="blog-text">{post.excerpt}</p>
                                </div>
                            </a>
                        </li>
                    ))}
                </ul>
            </section>
        </>
    );
}
