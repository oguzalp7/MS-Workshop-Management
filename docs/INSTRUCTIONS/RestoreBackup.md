## Yedeklenmiş Verinin Geri Yüklenmesi

* ```/infra/backups``` klasörüne yedek yüklenir. Ardından sırayla aşağıdaki komutlar çalıştırılır:
    ```
    docker exec workshop_postgres_prod psql -U workshop_user -d workshop_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    ```

    ```bash
    docker exec workshop_postgres_prod psql -U workshop_user -d workshop_db -f /backups/workshop_backup.sql
    ```
