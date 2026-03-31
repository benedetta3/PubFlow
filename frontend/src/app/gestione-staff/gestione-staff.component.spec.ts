import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestioneStaffComponent } from './gestione-staff.component';

describe('GestioneStaffComponent', () => {
  let component: GestioneStaffComponent;
  let fixture: ComponentFixture<GestioneStaffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestioneStaffComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestioneStaffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
