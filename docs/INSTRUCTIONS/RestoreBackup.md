## Yedeklenmiş Verinin Geri Yüklenmesi

* ```/infra/backups``` klasörüne yedek yüklenir. Ardından aşağıdaki komut çalıştırılır:
    ```bash
    docker exec workshop_postgres_prod psql -U workshop_user -d workshop_db -f /backups/workshop_backup.sql
    ```
    *Not: 
        - Eğer schema silinmek istenirse: docker exec workshop_postgres_prod psql -U workshop_user -d workshop_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        - Eğer schema silinmek istenmezse: Yukarıdaki komutta -f parametresi silinir. Ardından `\restrict jyqjwNYfW1v6nfwuSCpWQQWvyTYfZ33xoBXhS5O9IBIWOdvs8cP6ml4b5k9tWae` komutu çalıştırılır.