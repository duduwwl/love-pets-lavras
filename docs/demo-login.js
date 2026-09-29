document.querySelector('#demo-login').addEventListener('submit',event=>{
 event.preventDefault();
 const form=event.currentTarget;
 if(form.elements.password.value!=='lovepets-demo'){
  document.querySelector('#login-message').textContent='Use a senha de demonstração: lovepets-demo.';return;
 }
 location.assign(form.action);
});
