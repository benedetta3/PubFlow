package com.pubflow.model.repository;

import com.pubflow.model.entity.TavoloEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface TavoloRepository extends JpaRepository<TavoloEntity, Long> {
    Optional<TavoloEntity> findByNumero(Integer numero);
    Optional<TavoloEntity> findByCodiceSegreto(String codiceSegreto);
    List<TavoloEntity> findByStato(String stato);

    @Transactional
    @Modifying
    @Query("UPDATE TavoloEntity t SET t.stato = :stato WHERE t.numero = :numeroTavolo")
    int updateStato(Integer numeroTavolo, String stato);
}
