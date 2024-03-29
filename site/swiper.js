document.addEventListener('DOMContentLoaded', function() {
    const swiper = new Swiper('.swiper', {
        direction: 'horizontal',
        loop: true,
        slidesPerView: 3.25,
        navigation: {
            prevEl: '.fa-arrow-left',
            nextEl: '.fa-arrow-right',
        },
    });
});