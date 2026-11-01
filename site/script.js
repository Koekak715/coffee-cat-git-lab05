'use strict';
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');
function closeNavigation(){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Открыть меню');navigation.classList.remove('open');document.body.classList.remove('nav-open');}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');navigation.classList.toggle('open',open);document.body.classList.toggle('nav-open',open);});
navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeNavigation));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&navigation.classList.contains('open')){closeNavigation();toggle.focus();}});
window.matchMedia('(min-width:621px)').addEventListener('change',event=>{if(event.matches)closeNavigation();});
const header=document.querySelector('.header');
window.addEventListener('scroll',()=>header.classList.toggle('scrolled',window.scrollY>12),{passive:true});
if('IntersectionObserver' in window){
  const motion=window.matchMedia('(prefers-reduced-motion:reduce)');
  if(!motion.matches){document.body.classList.add('motion-ready');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));}
  const sectionObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){navigation.querySelectorAll('a').forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}}},{rootMargin:'-15% 0px -55% 0px',threshold:0});
  document.querySelectorAll('main section[id]').forEach(el=>sectionObserver.observe(el));
}
const filterButtons=document.querySelectorAll('.filter');
filterButtons.forEach(button=>button.addEventListener('click',()=>{filterButtons.forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});let count=0;document.querySelectorAll('.drink-card').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter;if(!card.hidden){count++;card.classList.add('visible');}});document.querySelector('#filter-status').textContent=`Показано напитков: ${count}`;}));
const dialog=document.querySelector('#details-dialog');
const drinkDetails={
  cappuccino:{name:'Капучино «Котик»',price:'250 ₽ · 250 мл',text:'Двойной эспрессо, молоко и плотная бархатная пенка. Классика, к которой приятно возвращаться.',ingredients:'Состав: эспрессо, молоко. Содержит молоко.'},
  latte:{name:'Карамельные лапки',price:'310 ₽ · 350 мл',text:'Нежный латте с карамелью и щепоткой морской соли. Когда хочется чуть больше сладости в обычном дне.',ingredients:'Состав: эспрессо, молоко, карамельный сироп, морская соль. Содержит молоко.'},
  raf:{name:'Ванильный мур',price:'340 ₽ · 350 мл',text:'Наш сливочный раф: кофе, сливки и натуральная ваниль взбиваются вместе до воздушной, шелковистой текстуры.',ingredients:'Состав: эспрессо, сливки, молоко, ванильный сахар. Содержит молоко. Растительная версия готовится на альтернативном молоке без сливок.'},
  americano:{name:'Чёрный кот',price:'190 ₽ · 250 мл',text:'Эспрессо и горячая вода — чтобы раскрыть вкус зерна. Шоколадные и ореховые ноты без добавления сиропов.',ingredients:'Состав: эспрессо, вода. Вкусовые ноты не означают наличие шоколада или орехов в составе.'},
  matcha:{name:'Зелёные глазки',price:'330 ₽ · 350 мл',text:'Японская матча и кокосовое молоко: мягкая текстура, травянистый вкус и лёгкая естественная сладость. Без кофе, но содержит кофеин.',ingredients:'Состав: матча, кокосовый напиток, вода. Состав растительного напитка и возможные аллергены уточняйте у бариста.'},
  mocha:{name:'Шоколадный сон',price:'320 ₽ · 350 мл',text:'Мокко для любителей насыщенных вкусов. Тёмный шоколад встречается с эспрессо, а молоко делает их дружбу особенно нежной.',ingredients:'Состав: эспрессо, молоко, тёмный шоколад. Содержит молоко; шоколад может содержать следы орехов.'}
};
let previousFocus;
function showDetails(title,eyebrow,paragraphs){previousFocus=document.activeElement;document.querySelector('#dialog-title').textContent=title;document.querySelector('#dialog-eyebrow').textContent=eyebrow;const content=document.querySelector('#dialog-content');content.replaceChildren();paragraphs.forEach(item=>{const p=document.createElement('p');p.textContent=typeof item==='string'?item:item.text;if(item.className)p.className=item.className;content.append(p);});dialog.showModal();document.body.classList.add('modal-open');}
document.querySelectorAll('[data-drink]').forEach(button=>button.addEventListener('click',()=>{const d=drinkDetails[button.dataset.drink];showDetails(d.name,'ВАША ЧАШКА СЧАСТЬЯ',[{text:d.price,className:'dialog-price'},d.text,{text:d.ingredients,className:'allergen-note'},'Для напитков с молоком доступна растительная альтернатива +60 ₽. Сообщите бариста об аллергии: напитки готовятся на общем оборудовании.']);}));
const offerDetails={
  morning:{title:'Утро начинается мягче',paragraphs:['Скидка 20% на один кофейный напиток из меню по будням с 08:00 до 11:00. Действует в кофейне и на напитки с собой.','Доплата за растительное молоко оплачивается полностью. С другими акциями и отметками по карте гостя не суммируется.']},
  friend:{title:'Приводи своего человека',paragraphs:['Каждую среду с 16:00 до 19:00 два капучино «Котик» объёмом 250 мл — по цене одного. Оба напитка выдаются в одном заказе.','Растительное молоко оплачивается дополнительно за каждый напиток. С другими акциями и картой гостя не суммируется.']},
  birthday:{title:'С днём мур-рождения!',paragraphs:['В день рождения угощаем одним напитком из меню стоимостью до 350 ₽ при покупке любого десерта. Подарок можно получить один раз в этот день.','Покажите бариста документ с датой рождения. Мы не копируем и не сохраняем его. Растительное молоко оплачивается отдельно. С другими акциями не суммируется.']}
};
document.querySelectorAll('[data-offer]').forEach(button=>button.addEventListener('click',()=>{const offer=offerDetails[button.dataset.offer];showDetails(offer.title,'УСЛОВИЯ ПРИЯТНОСТЕЙ',[...offer.paragraphs,'Это демонстрационные условия для концепта кофейни. Перед визитом уточните действующие предложения.']);}));
document.querySelector('#loyalty-details').addEventListener('click',()=>showDetails('Правила нашей дружбы','КАРТА ЛЮБИМОГО ГОСТЯ',['Получите бесплатную бумажную карточку у бариста. Регистрация и передача личных данных не нужны.','За каждый напиток, оплаченный по полной цене, ставим одну лапку. Соберите пять отметок и получите шестой напиток из меню стоимостью до 350 ₽ в подарок.','Подарок выдаётся при предъявлении заполненной карты. Доплаты за растительное молоко оплачиваются отдельно. Карта действует 6 месяцев со дня первой отметки; срок отмечает бариста.','Акционные и подарочные напитки не дают отметок. Карта не суммируется с другими предложениями, не обменивается на деньги и не восстанавливается при утере. Условия приведены для демонстрации.']));
function closeDialog(){dialog.close();}
document.querySelector('.dialog-close').addEventListener('click',closeDialog);document.querySelector('.dialog-done').addEventListener('click',closeDialog);
dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)closeDialog();}});
dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');previousFocus?.focus();});
document.querySelector('#copy-address').addEventListener('click',async()=>{const status=document.querySelector('#copy-status');try{await navigator.clipboard.writeText('Москва, ул. Примерная, 12 (демонстрационный адрес)');status.textContent='Адрес скопирован. Это пример для макета.';}catch{status.textContent='Адрес для копирования: Москва, ул. Примерная, 12 (пример).';}});
document.querySelector('#year').textContent=new Date().getFullYear();
