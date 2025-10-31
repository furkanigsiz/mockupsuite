import React, { useState } from 'react';
import AuthPage from './AuthPage';

interface LandingPageProps {
    onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    const [showAuth, setShowAuth] = useState(false);

    if (showAuth) {
        return <AuthPage />;
    }
    return (
        <div className="relative flex w-full flex-col">
            <div className="layout-container flex h-full grow flex-col">
                <div className="px-4 sm:px-10 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
                    <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
                        {/* TopNavBar */}
                        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 dark:border-b-[#283639] px-4 sm:px-10 py-3">
                            <div className="flex items-center gap-4 text-gray-800 dark:text-white">
                                <div className="size-6">
                                    <svg className="text-primary" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z" fill="currentColor"></path>
                                        <path clipRule="evenodd" d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764ZM4.95178 32.7688L21.4543 6.30267C22.6288 4.4191 25.3712 4.41909 26.5457 6.30267L43.0534 32.777C43.0709 32.8052 43.0878 32.8338 43.104 32.8629L41.3563 33.8352C43.104 32.8629 43.1038 32.8626 43.104 32.8629L43.1051 32.865L43.1065 32.8675L43.1101 32.8739L43.1199 32.8918C43.1276 32.906 43.1377 32.9246 43.1497 32.9473C43.1738 32.9925 43.2062 33.0545 43.244 33.1299C43.319 33.2792 43.4196 33.489 43.5217 33.7317C43.6901 34.1321 44 34.9311 44 35.7391C44 37.4427 43.003 38.7775 41.8558 39.7209C40.6947 40.6757 39.1354 41.4464 37.385 42.0552C33.8654 43.2794 29.133 44 24 44C18.867 44 14.1346 43.2794 10.615 42.0552C8.86463 41.4464 7.30529 40.6757 6.14419 39.7209C4.99695 38.7775 3.99999 37.4427 3.99999 35.7391C3.99999 34.8725 4.29264 34.0922 4.49321 33.6393C4.60375 33.3898 4.71348 33.1804 4.79687 33.0311C4.83898 32.9556 4.87547 32.8935 4.9035 32.8471C4.91754 32.8238 4.92954 32.8043 4.93916 32.7889L4.94662 32.777L4.95178 32.7688ZM35.9868 29.004L24 9.77997L12.0131 29.004C12.4661 28.8609 12.9179 28.7342 13.3617 28.6282C16.4281 27.8961 20.0901 27.4783 24 27.4783C27.9099 27.4783 31.5719 27.8961 34.6383 28.6282C35.082 28.7342 35.5339 28.8609 35.9868 29.004Z" fill="currentColor" fillRule="evenodd"></path>
                                    </svg>
                                </div>
                                <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">MockupSuite</h2>
                            </div>
                            <div className="hidden md:flex flex-1 justify-end gap-8">
                                <div className="flex items-center gap-9">
                                    <a className="text-gray-600 dark:text-white text-sm font-medium leading-normal" href="#">Features</a>
                                    <a className="text-gray-600 dark:text-white text-sm font-medium leading-normal" href="#">Pricing</a>
                                    <a className="text-gray-600 dark:text-white text-sm font-medium leading-normal" href="#">Examples</a>
                                    <a className="text-gray-600 dark:text-white text-sm font-medium leading-normal" href="#">Contact</a>
                                </div>
                                <button onClick={() => setShowAuth(true)} className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-gray-900 dark:text-[#111718] text-sm font-bold leading-normal tracking-[0.015em]">
                                    <span className="truncate">Get Started for Free</span>
                                </button>
                            </div>
                        </header>
                        <main className="flex-1">
                            {/* HeroSection */}
                            <div className="py-16 sm:py-24">
                                <div className="@container">
                                    <div className="flex flex-col gap-8 px-4 py-10 @[480px]:gap-10 @[864px]:flex-row-reverse">
                                        <div className="w-full bg-center bg-no-repeat aspect-square sm:aspect-video bg-cover rounded-xl @[480px]:h-auto @[480px]:min-w-[300px] @[864px]:w-full" data-alt="An AI-generated mockup of a product on a clean background, showing a before-and-after effect." style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBVXGcJzgLeQzfxHwt5gzzDrpt1Y3t0s7bh1euERG22VQFaUygaboJajcspvYFZIIeYzCOMHCF9D90hDe3vEgik7JCpKmpTvjmZmCzF3vB145voTnMfs8XecktJnX2Yy6uagonS5daKOtZyenH3bcYtu-_uTkSDp5yTjU7uKdVYvX2Z2hFjJpb2z-XhkaCQvQY1MYn7UKrKKjrqSjnas2E35IqvvM0JogbVryibQM0UBye3E_KE8qr0W3dkyc-O501pNwL5o9gipxg")' }}></div>
                                        <div className="flex flex-col gap-6 @[480px]:min-w-[400px] @[480px]:gap-8 @[864px]:justify-center">
                                            <div className="flex flex-col gap-4 text-left">
                                                <h1 className="text-gray-900 dark:text-white text-4xl font-bold leading-tight tracking-tighter @[480px]:text-5xl">
                                                    Create Stunning Product Mockups in Seconds with AI.
                                                </h1>
                                                <h2 className="text-gray-600 dark:text-gray-300 text-base font-normal leading-normal @[480px]:text-lg">
                                                    Transform your product photos into professional studio shots and generate realistic mockups instantly. No studio required.
                                                </h2>
                                            </div>
                                            <div className="flex-wrap gap-3 flex">
                                                <button onClick={() => setShowAuth(true)} className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 @[480px]:h-12 @[480px]:px-5 bg-primary text-gray-900 dark:text-[#111718] text-sm font-bold leading-normal tracking-[0.015em] @[480px]:text-base">
                                                    <span className="truncate">Generate Mockup</span>
                                                </button>
                                                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 @[480px]:h-12 @[480px]:px-5 bg-gray-200 dark:bg-[#283639] text-gray-800 dark:text-white text-sm font-bold leading-normal tracking-[0.015em] @[480px]:text-base">
                                                    <span className="truncate">See Examples</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* How It Works Section */}
                            <div className="py-16 sm:py-24">
                                <h2 className="text-gray-900 dark:text-white text-2xl font-bold leading-tight tracking-tight px-4 pb-8 pt-5 text-center">How It Works</h2>
                                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 p-4">
                                    <div className="flex flex-1 gap-4 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col text-center items-center">
                                        <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">1. Upload Your Image</h3>
                                            <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">Start with a simple photo of your product or your unique design file.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-1 gap-4 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col text-center items-center">
                                        <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">2. Let AI Work Its Magic</h3>
                                            <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">Our AI analyzes your image and generates high-quality, realistic mockups.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-1 gap-4 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col text-center items-center">
                                        <span className="material-symbols-outlined text-primary text-3xl">download</span>
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">3. Download Your Mockup</h3>
                                            <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">Get your studio-quality photos ready for your store or social media.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Feature Showcase Section */}
                            <div className="py-16 sm:py-24">
                                <div className="flex flex-col gap-10 px-4 py-10 @container">
                                    <div className="flex flex-col gap-4 max-w-[720px] mx-auto text-center">
                                        <h1 className="text-gray-900 dark:text-white text-[32px] font-bold leading-tight @[480px]:text-4xl">
                                            Elevate Your Product's Visuals
                                        </h1>
                                        <p className="text-gray-600 dark:text-gray-300 text-base font-normal leading-normal">Discover the powerful features that make mockup creation effortless and professional.</p>
                                    </div>
                                    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 p-0">
                                        <div className="flex flex-1 gap-3 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col">
                                            <span className="material-symbols-outlined text-primary text-2xl">photo_camera</span>
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">Studio-Quality Photos</h3>
                                                <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">Generate photorealistic images that look like they were taken in a professional studio.</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-1 gap-3 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col">
                                            <span className="material-symbols-outlined text-primary text-2xl">inventory_2</span>
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">Instant Mockups</h3>
                                                <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">Instantly place your designs on a variety of products, from apparel to print.</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-1 gap-3 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col">
                                            <span className="material-symbols-outlined text-primary text-2xl">light_mode</span>
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">Perfect Lighting &amp; Shadows</h3>
                                                <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">Our AI automatically adjusts lighting and shadows for a perfectly realistic result.</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-1 gap-3 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col">
                                            <span className="material-symbols-outlined text-primary text-2xl">image</span>
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">Endless Backgrounds</h3>
                                                <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">Choose from a vast library of backgrounds or generate a custom one to match your brand.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Testimonial Section */}
                            <div className="py-16 sm:py-24">
                                <div className="flex flex-col gap-8 items-center text-center px-4">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest">TRUSTED BY TEAMS WORLDWIDE</p>
                                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
                                        <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">Logoipsum</p>
                                        <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">Aperture</p>
                                        <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">Echelon</p>
                                        <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">Monolith</p>
                                        <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">Quantum</p>
                                    </div>
                                    <div className="max-w-2xl mx-auto pt-8">
                                        <blockquote className="text-lg italic text-gray-700 dark:text-gray-300">"MockupSuite has revolutionized how we showcase our products. The quality is incredible, and it saves us countless hours and thousands of dollars on photoshoots."</blockquote>
                                        <p className="mt-4 font-semibold text-gray-800 dark:text-white">Jane Doe, Founder of CoolBrand</p>
                                    </div>
                                </div>
                            </div>
                            {/* Final CTA Section */}
                            <div className="py-16 sm:py-24">
                                <div className="bg-gray-100 dark:bg-[#1c2527] rounded-xl p-10 sm:p-16 flex flex-col items-center text-center gap-6">
                                    <h2 className="text-gray-900 dark:text-white text-3xl sm:text-4xl font-bold tracking-tight">Ready to Elevate Your Product's Visuals?</h2>
                                    <p className="text-gray-600 dark:text-gray-300 max-w-xl">Join thousands of creators and businesses who are creating stunning visuals without the hassle. Get started for free today.</p>
                                    <button onClick={() => setShowAuth(true)} className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-gray-900 dark:text-[#111718] text-base font-bold leading-normal tracking-[0.015em]">
                                        <span className="truncate">Get Started Now</span>
                                    </button>
                                </div>
                            </div>
                        </main>
                        {/* Footer */}
                        <footer className="border-t border-gray-200 dark:border-gray-800 py-10 mt-16">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-8 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-5">
                                        <svg className="text-primary" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z" fill="currentColor"></path><path clipRule="evenodd" d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764ZM4.95178 32.7688L21.4543 6.30267C22.6288 4.4191 25.3712 4.41909 26.5457 6.30267L43.0534 32.777C43.0709 32.8052 43.0878 32.8338 43.104 32.8629L41.3563 33.8352C43.104 32.8629 43.1038 32.8626 43.104 32.8629L43.1051 32.865L43.1065 32.8675L43.1101 32.8739L43.1199 32.8918C43.1276 32.906 43.1377 32.9246 43.1497 32.9473C43.1738 32.9925 43.2062 33.0545 43.244 33.1299C43.319 33.2792 43.4196 33.489 43.5217 33.7317C43.6901 34.1321 44 34.9311 44 35.7391C44 37.4427 43.003 38.7775 41.8558 39.7209C40.6947 40.6757 39.1354 41.4464 37.385 42.0552C33.8654 43.2794 29.133 44 24 44C18.867 44 14.1346 43.2794 10.615 42.0552C8.86463 41.4464 7.30529 40.6757 6.14419 39.7209C4.99695 38.7775 3.99999 37.4427 3.99999 35.7391C3.99999 34.8725 4.29264 34.0922 4.49321 33.6393C4.60375 33.3898 4.71348 33.1804 4.79687 33.0311C4.83898 32.9556 4.87547 32.8935 4.9035 32.8471C4.91754 32.8238 4.92954 32.8043 4.93916 32.7889L4.94662 32.777L4.95178 32.7688ZM35.9868 29.004L24 9.77997L12.0131 29.004C12.4661 28.8609 12.9179 28.7342 13.3617 28.6282C16.4281 27.8961 20.0901 27.4783 24 27.4783C27.9099 27.4783 31.5719 27.8961 34.6383 28.6282C35.082 28.7342 35.5339 28.8609 35.9868 29.004Z" fill="currentColor" fillRule="evenodd"></path></svg>
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">© 2024 MockupSuite. All rights reserved.</span>
                                </div>
                                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                                    <a className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary" href="#">About Us</a>
                                    <a className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary" href="#">Contact</a>
                                    <a className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary" href="#">Terms of Service</a>
                                    <a className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary" href="#">Privacy Policy</a>
                                </div>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
