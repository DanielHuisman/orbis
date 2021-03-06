import {Orbis} from '../orbis';
import {EntityMetadata} from '../metadata';
import {findOne} from '../queries/findOne';
import {OperationOptions} from '../util';

import {updateRelation} from './relations';

// TODO: find a way to have correct where and data typing (typegen?)
// Data might be similar to CreateOneArguments
export interface UpdateOneArguments {
    where: {[key: string]: any};
    data: {[key: string]: any};
    relations?: string[];
}

export const updateEntity = async <Entity>(
    orbis: Orbis,
    metadata: EntityMetadata,
    entity: Entity,
    args: UpdateOneArguments,
    options: OperationOptions = {}
): Promise<void> => {
    // Find entity repository
    const repository = orbis.getManager().getRepository(metadata.Entity);

    // Create update query builder
    const qb = repository
        .createQueryBuilder(metadata.singularName)
        .update()
        .whereInIds(repository.getId(entity));

    // Parse data
    const values = {};
    for (const [fieldName, fieldValue] of Object.entries(args.data)) {
        if (metadata.relations.includes(fieldName)) {
            if (Array.isArray(fieldValue)) {
                for (const value of fieldValue as any[]) {
                    await updateRelation<Entity>(orbis, metadata, fieldName, value, true, {
                        context: options.context
                    }, entity);
                }
            } else {
                await updateRelation<Entity>(orbis, metadata, fieldName, fieldValue, true, {
                    context: options.context
                }, entity);
            }
        } else {
            values[fieldName] = fieldValue;
            entity[fieldName] = fieldValue;
        }
    }

    // Schema validation
    if (orbis.getMetadata().hasSchema(metadata.Entity.name)) {
        await orbis.getMetadata().getSchema(metadata.Entity.name).validate(entity);
    }

    if (Object.keys(values).length > 0) {
        // Execute update query
        qb.set(values);

        // Add data to query runner for subscribers
        repository.queryRunner.data.orbis = {
            id: repository.getId(entity),
            values
        };

        await qb.execute();
    }
};

export const updateOne = async <Entity>(
    orbis: Orbis,
    metadata: EntityMetadata,
    args: UpdateOneArguments,
    options: OperationOptions = {}
): Promise<Entity> => {
    // Run find and update in a transction
    await orbis.transaction(async () => {
        // Find entity without relations
        const entity = await findOne<Entity>(orbis, metadata, {
            where: args.where
        }, {
            context: options.context,
            notFoundError: true
        });

        // Update entity
        await updateEntity(orbis, metadata, entity, args, {
            context: options.context
        });
    }, false);

    // Find entity again with relations
    return await findOne(orbis, metadata, {
        where: args.where,
        relations: args.relations
    }, {
        context: options.context
    });
};
