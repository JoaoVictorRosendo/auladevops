

-Para buildar: docker compose up --build -d


-Para rodar : docker compose up

-Para acessar banco de dados usando container Docker diretamente (Execute no PowerShell):
 docker exec -it tortos-db mysql -u user -ppassword marmitadb

 Para ver a tabela no MySQL, execute no prompt:
USE marmitadb;
SHOW TABLES;
               OU
Abra o MySql e execute : USE marmitadb;



-Rodando em http://localhost:3000/

-Front-end atualizado para o sistema "Poupe & Previna":
  * Login renovado com nova identidade visual
  * Dashboard de controle de validade de alimentos e remédios
  * Datas de validade são salvas localmente no navegador
  * Itens com 3 dias ou menos para vencer ganham destaque visual

  --FLUXO SUBIDA DE CODIGO--
  
-git branch

-git checkout nome-da-branch 

-git pull origin develop
faz alterações

-git add .

-git commit -m "sua mensagem"

-git push origin develop

