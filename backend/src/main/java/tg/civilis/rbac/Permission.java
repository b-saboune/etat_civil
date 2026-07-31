package tg.civilis.rbac;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** RG-RBAC-001 : une permission = couple unique (module, action). */
@Entity
@Table(name = "permission")
@Getter @Setter @NoArgsConstructor
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String module;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(nullable = false, unique = true, length = 100)
    private String code;
}
