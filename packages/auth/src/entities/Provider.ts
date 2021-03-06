import {Entity, PrimaryColumn, Column, ManyToOne} from 'typeorm';
import {Relation} from '@orbis-framework/core';

import {getUserType} from '../config';
import {orbis} from '../orbis';

import {BaseUser} from './BaseUser';

@orbis.Object()
@Entity()
export class Provider {

    @orbis.Field()
    @PrimaryColumn()
    id: string;

    @orbis.Field()
    @Column({type: 'varchar', length: 255})
    type: string;

    @orbis.Field({graphql: false})
    @Column({type: 'varchar', length: 255})
    identifier: string;

    @orbis.Field({graphql: false})
    @Column({type: 'text'})
    credentials: string;

    @orbis.Field()
    @Column({type: 'varchar', length: 255})
    email: string;

    @orbis.Field()
    @Column({type: 'boolean', default: () => 'false'})
    isVerified: boolean;

    @orbis.Field(() => getUserType())
    @ManyToOne(() => getUserType(), (user) => user.providers, {onDelete: 'CASCADE', lazy: true, nullable: false})
    user: Relation<BaseUser>;
}
